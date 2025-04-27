import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export function EditProfileModal() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loadProfileData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      setName(profile.name || "");
      setTitle(profile.title || "");
      setBio(profile.bio || "");
    }

    const { data: socialUrls } = await supabase
      .from('social_urls')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (socialUrls) {
      setWebsite(socialUrls.website_url || "");
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${path}/${Math.random()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('files')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let avatarUrl;
      let bannerUrl;

      if (avatarFile) {
        avatarUrl = await uploadFile(avatarFile, 'avatars');
      }

      if (bannerFile) {
        bannerUrl = await uploadFile(bannerFile, 'banners');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name,
          title,
          bio,
          avatar_url: avatarUrl || undefined,
          banner_url: bannerUrl || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: socialError } = await supabase
        .from('social_urls')
        .upsert({
          user_id: user.id,
          website_url: website,
          updated_at: new Date().toISOString(),
        });

      if (socialError) throw socialError;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-sage-600 hover:bg-sage-700 w-full md:w-auto"
          onClick={() => {
            setIsOpen(true);
            loadProfileData();
          }}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="avatar">Profile Photo</Label>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="banner">Banner Image</Label>
            <Input
              id="banner"
              type="file"
              accept="image/*"
              onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              placeholder="Your name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              placeholder="Your professional title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              className="min-h-[100px]"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input 
              id="website" 
              placeholder="Your website URL" 
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            className="bg-sage-600 hover:bg-sage-700"
            onClick={handleSave}
            disabled={isLoading}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}