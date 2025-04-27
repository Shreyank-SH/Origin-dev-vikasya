import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Trash, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import DOMPurify from "isomorphic-dompurify";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    created_at: string;
    image_url: string | null;
    likes_count: number;
    user_id: string;
    profile: {
      name: string;
      avatar_url: string | null;
    };
    has_liked?: boolean;
  };
}

interface ToggleLikeParams {
  postId: string;
  hasLiked: boolean;
}

export function PostCard({ post }: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthor, setIsAuthor] = useState(false);

  // Check if current user is the author
  useEffect(() => {
    const checkAuthor = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthor(user?.id === post.user_id);
    };
    checkAuthor();
  }, [post.user_id]);

  // Check if post is within 5-minute edit window
  const checkEditWindow = async () => {
    console.log("Checking edit window for post:", post.id);
    const { data, error } = await supabase
      .rpc('is_post_editable', { post_created_at: post.created_at });
    
    if (error) {
      console.error('Error checking edit window:', error);
      return false;
    }
    console.log("Edit window result:", data);
    return data;
  };

  const deletePost = useMutation({
    mutationFn: async () => {
      console.log("Deleting post:", post.id);
      // Delete post likes first
      const { error: likesError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', post.id);

      if (likesError) throw likesError;

      // Then delete the post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;
    },
    onSuccess: () => {
      console.log("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePost = useMutation({
    mutationFn: async () => {
      console.log("Updating post:", post.id);
      const isEditable = await checkEditWindow();
      if (!isEditable) {
        throw new Error("Posts can only be edited within 5 minutes of creation");
      }

      const { error } = await supabase
        .from('posts')
        .update({ 
          content: editedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);

      if (error) throw error;
    },
    onSuccess: () => {
      console.log("Post updated successfully");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        title: "Success",
        description: "Post updated successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Error updating post:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleLike = useMutation({
    mutationFn: async ({ postId, hasLiked }: ToggleLikeParams) => {
      console.log("Toggling like for post:", postId, "current state:", hasLiked);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      setIsLiking(true);

      if (hasLiked) {
        // Remove like
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        // Decrement global count
        const { data, error } = await supabase
          .rpc('decrement_likes', { post_id: postId })
          .single();

        if (error) throw error;
        return data;
      } else {
        // Add new like
        await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: user.id }]);

        // Increment global count
        const { data, error } = await supabase
          .rpc('increment_likes', { post_id: postId })
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      console.log("Like toggled successfully");
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: Error) => {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLiking(false);
    },
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-sage-200 overflow-hidden">
            {post.profile.avatar_url && (
              <img 
                src={post.profile.avatar_url} 
                alt={post.profile.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div>
            <h3 className="font-semibold">{post.profile.name}</h3>
            <p className="text-sm text-sage-600">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        {isAuthor && (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deletePost.mutate()}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => updatePost.mutate()}
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div 
          className="text-gray-700 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ 
            __html: DOMPurify.sanitize(post.content) 
          }}
        />
      )}
      
      {post.image_url && (
        <img 
          src={post.image_url} 
          alt="Post content" 
          className="rounded-lg max-h-96 w-full object-cover"
        />
      )}
      <div className="flex items-center justify-between pt-2 border-t">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            if (!isLiking) {
              toggleLike.mutate({ 
                postId: post.id, 
                hasLiked: post.has_liked || false 
              });
            }
          }}
          className={`group ${post.has_liked ? "text-red-500" : ""}`}
        >
          <Heart 
            className={`h-4 w-4 mr-2 transition-transform group-hover:scale-125 ${
              post.has_liked ? "fill-current" : ""
            } ${isLiking ? "animate-ping" : ""}`} 
          />
          {post.likes_count || 0} Likes
        </Button>
      </div>
    </div>
  );
}