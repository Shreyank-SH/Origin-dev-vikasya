import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import Navbar from "@/components/Navbar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { TeamSection } from "@/components/projects/TeamSection";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  banner_url: string | null;
  details: string | null;
  detail_images: string[] | null;
  user_id: string;
  created_at: string;
  owner: {
    id: string;
    name: string;
    title: string;
    avatar_url: string;
  };
}

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string>();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
    };
    getUser();
  }, []);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      console.log('Fetching project details for id:', id);
      if (!id) throw new Error('Project ID is required');
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          owner:profiles!projects_user_id_fkey (
            id,
            name,
            title,
            avatar_url
          )
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching project:', error);
        throw error;
      }
      console.log('Project data:', data);
      return data as Project;
    },
    enabled: !!id,
  });

  const { data: joinRequests } = useQuery({
    queryKey: ['projectJoinRequests', id],
    queryFn: async () => {
      console.log('Fetching join requests for project:', id);
      if (!id) throw new Error('Project ID is required');
      
      const { data, error } = await supabase
        .from('project_join_requests')
        .select(`
          *,
          profiles!project_join_requests_user_id_fkey (
            id,
            name,
            title,
            avatar_url
          )
        `)
        .eq('project_id', id);
      
      if (error) {
        console.error('Error fetching join requests:', error);
        throw error;
      }
      console.log('Join requests:', data);
      return data;
    },
    enabled: !!id,
  });

  const handleJoinRequest = useMutation({
    mutationFn: async () => {
      if (!id || !currentUserId) throw new Error('Project ID and user ID are required');
      
      // First check if a request already exists
      const { data: existingRequest } = await supabase
        .from('project_join_requests')
        .select('id, status')
        .eq('project_id', id)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (existingRequest) {
        // If request exists and was rejected, update it
        if (existingRequest.status === 'rejected') {
          const { error } = await supabase
            .from('project_join_requests')
            .update({ status: 'pending' })
            .eq('id', existingRequest.id);

          if (error) throw error;
        } else {
          throw new Error('A request already exists');
        }
      } else {
        // If no request exists, create a new one
        const { error } = await supabase
          .from('project_join_requests')
          .insert({
            project_id: id,
            user_id: currentUserId,
            status: 'pending'
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectJoinRequests', id] });
      toast({
        title: "Success",
        description: "Join request sent successfully",
      });
    },
    onError: (error: Error) => {
      // Only show error toast if it's not "A request already exists"
      if (error.message !== 'A request already exists') {
        toast({
          title: "Error",
          description: "Failed to send join request",
          variant: "destructive",
        });
      }
    },
  });

  if (!id) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Invalid Project ID</h1>
            <Button 
              className="mt-4"
              onClick={() => navigate('/projects')}
            >
              Back to Projects
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-20">
          <div className="animate-pulse">
            <div className="h-64 bg-muted rounded-lg mb-6" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-24 bg-muted rounded" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Project not found</h1>
            <Button 
              className="mt-4"
              onClick={() => navigate('/projects')}
            >
              Back to Projects
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const isOwner = project.user_id === currentUserId;
  const pendingRequests = joinRequests?.filter(req => req.status === 'pending') || [];
  const approvedRequests = joinRequests?.filter(req => req.status === 'approved') || [];
  const userJoinRequest = joinRequests?.find(
    request => request.user_id === currentUserId
  );

  const approvedMembers = joinRequests?.filter(request => request.status === 'approved').length || 0;
  const memberCount = approvedMembers + 1; 

  const hasRequestedToJoin = joinRequests?.some(
    request => request.user_id === currentUserId && request.status === 'pending'
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-20">
        <div className="max-w-4xl mx-auto">
          <ProjectHeader 
            project={project}
            isOwner={isOwner}
            memberCount={memberCount}
          />

          <div className="space-y-6 mb-6">
            {/* Description Section */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
            </Card>

            {/* Details Section */}
            {project.details && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Details</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{project.details}</p>
              </Card>
            )}

            {/* Images Section */}
            {project.detail_images && project.detail_images.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Project Images</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.detail_images.map((image: string, index: number) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Project detail ${index + 1}`}
                      className="rounded-lg max-h-96 w-full object-cover"
                    />
                  ))}
                </div>
              </Card>
            )}

            <TeamSection 
              projectId={id}
              isOwner={isOwner}
              owner={project.owner}
              approvedRequests={approvedRequests}
              pendingRequests={pendingRequests}
            />

            {!isOwner && !hasRequestedToJoin && (
              <div className="flex justify-center mt-6">
                <Button 
                  onClick={() => handleJoinRequest.mutate()}
                  disabled={handleJoinRequest.isPending}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {handleJoinRequest.isPending ? "Sending Request..." : "Request to Join"}
                </Button>
              </div>
            )}
            {hasRequestedToJoin && (
              <div className="flex justify-center mt-6">
                <Button 
                  variant="secondary"
                  disabled
                  className="w-full sm:w-auto"
                >
                  Request Pending
                </Button>
              </div>
            )}

            {/* Creation Date */}
            <div className="text-sm text-muted-foreground text-right">
              Created on {project.created_at ? format(new Date(project.created_at), 'PPP') : 'Unknown date'}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectDetails;