import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Plus, Users, MessageSquare, Lock, LockOpen, Edit, Upload, Trash } from "lucide-react";
import { CreatePost } from "@/components/feed/CreatePost";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ClubDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(true);

  const { data: clubData } = useQuery({
    queryKey: ['club', id],
    queryFn: async () => {
      console.log("Fetching club details...");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: club, error } = await supabase
        .from('groups')
        .select(`
          *,
          members:group_members(count),
          discussions:discussions(
            id,
            title,
            description,
            created_at,
            creator:profiles(name, avatar_url)
          ),
          group_posts:posts(
            id,
            content,
            image_url,
            created_at,
            user:profiles(name, avatar_url)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch user's membership status
      const { data: membership, error: membershipError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      const isMember = !membershipError && membership !== null;
      const isCreator = club.creator_id === user.id;
      setIsPublic(!club.is_private);

      return { 
        ...club, 
        isMember,
        isCreator,
        posts: club.group_posts || [],
        _count: {
          members: club.members?.[0]?.count || 0,
          discussions: club.discussions?.length || 0
        }
      };
    },
  });

  const updateGroup = useMutation({
    mutationFn: async ({ name, description, bannerUrl }: { name: string; description: string; bannerUrl?: string }) => {
      const { error } = await supabase
        .from('groups')
        .update({ 
          name,
          description,
          ...(bannerUrl && { banner_url: bannerUrl })
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Club updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['club', id] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateGroup = async () => {
    let bannerUrl = undefined;
    
    if (bannerFile) {
      const fileExt = bannerFile.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, bannerFile);
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(filePath);
      
      bannerUrl = publicUrl;
    }

    updateGroup.mutate({
      name: editedName,
      description: editedDescription,
      bannerUrl,
    });
  };

  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club', id] });
      toast({
        title: "Success",
        description: "Message deleted successfully",
      });
    },
  });

  useEffect(() => {
    if (clubData) {
      setEditedName(clubData.name);
      setEditedDescription(clubData.description);
      setIsPublic(!clubData.is_private);
    }
  }, [clubData]);

  if (!clubData) return null;

  return (
    <div className="min-h-screen bg-sage-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-20">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate('/clubs')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clubs
          </Button>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              {isEditing ? (
                <div className="space-y-4 w-full">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Club name"
                  />
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="Club description"
                  />
                  <div 
                    className="border-2 border-dashed border-sage-200 rounded-lg p-4 text-center cursor-pointer"
                    onClick={() => document.getElementById('banner-upload')?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-sage-500" />
                    <p className="text-sm text-sage-600">
                      {bannerFile ? bannerFile.name : "Click to upload new banner"}
                    </p>
                    <input
                      id="banner-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files && setBannerFile(e.target.files[0])}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateGroup}>Save Changes</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-sage-800">{clubData.name}</h1>
                  {clubData.isCreator && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Club
                    </Button>
                  )}
                </>
              )}
            </div>
            
            {!isEditing && (
              <>
                <p className="text-sage-600 mb-4">{clubData.description}</p>
                {clubData.banner_url && (
                  <img
                    src={clubData.banner_url}
                    alt="Club banner"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
              </>
            )}

            {(clubData.isMember || clubData.isCreator) && (
              <div className="space-y-6">
                <div className="border-t pt-6">
                  <h2 className="text-lg font-semibold mb-4">Group Feed</h2>
                  <CreatePost groupId={id} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['club', id] })} />
                  
                  <div className="space-y-4 mt-6">
                    {clubData.posts?.map((post: any) => (
                      <div key={post.id} className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="h-8 w-8 rounded-full bg-sage-200 overflow-hidden">
                            {post.user.avatar_url && (
                              <img
                                src={post.user.avatar_url}
                                alt={post.user.name}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{post.user.name}</p>
                            <p className="text-sm text-sage-500">
                              {new Date(post.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-sage-800">{post.content}</p>
                        {post.image_url && (
                          <img
                            src={post.image_url}
                            alt="Post attachment"
                            className="mt-2 rounded-lg max-h-96 w-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClubDetails;
