import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const AddTutorialModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Creating new tutorial:", { title, content, category, videoUrl });
      
      // Get the current user's auth ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Verify admin status
      const { data: adminProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (profileError || !adminProfile) {
        throw new Error("Unauthorized: User is not an admin");
      }

      const { error } = await supabase
        .from("tutorials")
        .insert({
          title,
          content,
          category,
          video_url: videoUrl,
          user_id: adminProfile.id,
        });

      if (error) throw error;

      // Log admin action
      const { error: logError } = await supabase
        .from("admin_actions")
        .insert({
          admin_id: adminProfile.id,
          action_type: "create_tutorial",
          target_table: "tutorials",
          target_id: adminProfile.id,
          details: { title }
        });

      if (logError) {
        console.error("Error logging admin action:", logError);
      }

      queryClient.invalidateQueries({ queryKey: ["tutorials"] });
      toast({
        title: "Success",
        description: "Tutorial created successfully",
      });
      setIsOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error creating tutorial:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("");
    setVideoUrl("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Tutorial
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Tutorial</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Tutorial Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div>
            <Input
              placeholder="Video URL (optional)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              type="url"
            />
          </div>
          <div>
            <Textarea
              placeholder="Tutorial Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="min-h-[100px]"
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Tutorial"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};