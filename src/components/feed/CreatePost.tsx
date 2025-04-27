import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

interface CreatePostProps {
  groupId?: string;
  onSuccess?: () => void;
}

export function CreatePost({ groupId, onSuccess }: CreatePostProps) {
  const [newPost, setNewPost] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPost = useMutation({
    mutationFn: async ({ content, imageFile }: { content: string; imageFile: File | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let image_url = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('files')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('files')
          .getPublicUrl(filePath);

        image_url = publicUrl;
      }

      // Convert URLs in text to clickable links
      const contentWithLinks = content.replace(URL_REGEX, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

      const { data, error } = await supabase
        .from('posts')
        .insert([{ 
          content: contentWithLinks, 
          user_id: user.id,
          image_url,
          group_id: groupId
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ['club', groupId] });
      }
      setNewPost("");
      setSelectedImage(null);
      setPreviewUrl(null);
      toast({
        title: "Success",
        description: "Post created successfully",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() && !selectedImage) return;
    createPost.mutate({ 
      content: newPost, 
      imageFile: selectedImage
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
      <Textarea
        placeholder="What's on your mind?"
        value={newPost}
        onChange={(e) => setNewPost(e.target.value)}
        className="w-full min-h-[100px]"
      />
      {previewUrl && (
        <div className="relative">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="max-h-64 rounded-lg"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => {
              setSelectedImage(null);
              setPreviewUrl(null);
            }}
          >
            Remove
          </Button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageSelect}
          />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image className="h-4 w-4 mr-2" />
            Image
          </Button>
        </div>
        <Button 
          className="bg-sage-600 hover:bg-sage-700"
          onClick={handleCreatePost}
          disabled={createPost.isPending}
        >
          <Send className="h-4 w-4 mr-2" />
          Post
        </Button>
      </div>
    </div>
  );
}
