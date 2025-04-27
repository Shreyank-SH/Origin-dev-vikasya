import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { ProjectsHeader } from "@/components/projects/ProjectsHeader";
import { ProjectSearch } from "@/components/projects/ProjectSearch";
import { ProjectList } from "@/components/projects/ProjectList";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

const Projects = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
    };
    getUser();
  }, []);

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('*');
      
      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load projects",
      variant: "destructive",
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-20">
        <div className="max-w-6xl mx-auto">
          <ProjectsHeader />
          <ProjectSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[300px] bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <ProjectList 
              projects={projects || []} 
              currentUserId={currentUserId}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Projects;