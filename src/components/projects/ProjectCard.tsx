import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Eye, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { EditProjectModal } from "@/components/modals/EditProjectModal";

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    category: string;
    banner_url: string | null;
    details: string | null;
    user_id: string;
  };
  currentUserId: string | undefined;
  onDelete?: () => void;
}

export const ProjectCard = ({ project, currentUserId, onDelete }: ProjectCardProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isOwner = project.user_id === currentUserId;

  const { data: joinRequests } = useQuery({
    queryKey: ['projectJoinRequests', project.id],
    queryFn: async () => {
      console.log('Fetching join requests for project:', project.id);
      const { data, error } = await supabase
        .from('project_join_requests')
        .select('*')
        .eq('project_id', project.id);
      
      if (error) throw error;
      return data;
    },
  });

  const deleteProject = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      onDelete?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleJoinRequest = async () => {
    try {
      const { error } = await supabase
        .from('project_join_requests')
        .insert({
          project_id: project.id,
          user_id: currentUserId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Join request sent successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send join request",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = () => {
    navigate(`/projects/${project.id}`);
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProject.mutate();
    }
  };

  const handleProjectUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const userJoinRequest = joinRequests?.find(
    request => request.user_id === currentUserId
  );

  const approvedMembers = joinRequests?.filter(request => request.status === 'approved').length || 0;
  const memberCount = approvedMembers + 1;

  const truncatedTitle = project.title.length > 25 
    ? project.title.substring(0, 25) + '...'
    : project.title;

  const truncatedDescription = project.description.length > 40
    ? project.description.substring(0, 40) + '...'
    : project.description;

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
      {project.banner_url ? (
        <div 
          className="h-48 bg-cover bg-center rounded-t-lg" 
          style={{ backgroundImage: `url(${project.banner_url})` }}
        />
      ) : (
        <div className="h-48 bg-emerald-500 rounded-t-lg" />
      )}
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl line-clamp-1">{truncatedTitle}</CardTitle>
            <Badge variant="secondary" className="mt-2">
              {project.category}
            </Badge>
          </div>
          {isOwner && (
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleEdit}
                className="hover:bg-secondary"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDelete}
                className="hover:bg-red-100 hover:text-red-600"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm line-clamp-2">
          {truncatedDescription}
        </CardDescription>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="text-sm text-muted-foreground">
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleViewDetails}
            className="w-full sm:w-auto"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          {!isOwner && !userJoinRequest && (
            <Button 
              onClick={handleJoinRequest} 
              size="sm"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Request to Join
            </Button>
          )}
          {!isOwner && userJoinRequest?.status === 'pending' && (
            <Badge variant="secondary" className="px-4 py-2 w-full sm:w-auto text-center">
              Request Pending
            </Badge>
          )}
        </div>
      </CardFooter>
      </Card>
      
      <EditProjectModal
        project={project}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleProjectUpdate}
      />
    </>
  );
};