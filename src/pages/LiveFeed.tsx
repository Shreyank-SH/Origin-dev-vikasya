import Navbar from "@/components/Navbar";
import { CreatePost } from "@/components/feed/CreatePost";
import { PostList } from "@/components/feed/PostList";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const LiveFeed = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, title, bio, role')
        .eq('id', user.id)
        .single();

      // Skip profile completion check for admin users
      if (profile?.role === 'admin') return;

      if (!profile?.name || !profile?.title || !profile?.bio) {
        toast({
          title: "Complete Your Profile",
          description: "Please add your details to get started.",
          duration: 5000,
        });
        navigate("/profile");
      }
    };

    checkProfile();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-sage-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-20">
        <div className="max-w-2xl mx-auto space-y-6">
          <CreatePost />
          <PostList />
        </div>
      </main>
    </div>
  );
};

export default LiveFeed;