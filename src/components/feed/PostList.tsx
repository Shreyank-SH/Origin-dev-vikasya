import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "./PostCard";
import { PostSkeleton } from "./PostSkeleton";

export function PostList() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profile:profiles(name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user's likes
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);

      const likedPostIds = new Set(likes?.map(like => like.post_id));

      return data.map((post) => ({
        ...post,
        has_liked: likedPostIds.has(post.id)
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts?.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}