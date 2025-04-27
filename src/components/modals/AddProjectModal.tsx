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
import { Upload, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function AddProjectModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    details: "",
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      let bannerUrl = null;
      if (bannerFile) {
        const fileExt = bannerFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('files')
          .upload(`project-banners/${fileName}`, bannerFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('files')
          .getPublicUrl(`project-banners/${fileName}`);
          
        bannerUrl = publicUrl;
      }

      const { error } = await supabase
        .from('projects')
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          details: formData.details,
          banner_url: bannerUrl,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project created successfully",
      });
      
      setIsOpen(false);
      setFormData({ title: "", description: "", category: "", details: "" });
      setBannerFile(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBannerFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Create a new project to collaborate with others.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="project-title">Project Title</Label>
            <Input
              id="project-title"
              placeholder="Enter project title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              placeholder="Describe your project..."
              className="min-h-[100px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project-details">Details</Label>
            <Textarea
              id="project-details"
              placeholder="Add detailed information about your project..."
              className="min-h-[150px]"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Project Banner</Label>
            <div className="border-2 border-dashed border-input rounded-lg p-4 text-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="banner-upload"
                onChange={handleFileChange}
              />
              <label
                htmlFor="banner-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {bannerFile ? bannerFile.name : "Drag & drop or click to upload"}
                </p>
              </label>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project-category">Category</Label>
            <Input
              id="project-category"
              placeholder="e.g., Technology, Research"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}