import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserCheck, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface TeamSectionProps {
  projectId: string;
  isOwner: boolean;
  owner: {
    name: string;
    title: string | null;
    avatar_url: string | null;
  };
  approvedRequests: any[];
  pendingRequests: any[];
}

export const TeamSection = ({ 
  projectId, 
  isOwner, 
  owner, 
  approvedRequests, 
  pendingRequests 
}: TeamSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('project_join_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['projectJoinRequests', projectId] });
      toast({
        title: "Success",
        description: `Request ${status} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${status} request`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Team</h2>
      </div>
      
      <div className="space-y-4">
        {/* Project Owner */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex-shrink-0">
            {owner.avatar_url ? (
              <img 
                src={owner.avatar_url} 
                alt={owner.name}
                className="h-12 w-12 rounded-full"
              />
            ) : (
              <div className="h-12 w-12 bg-emerald-200 rounded-full flex items-center justify-center">
                <span className="text-emerald-700 font-medium">
                  {owner.name?.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium">{owner.name}</h3>
            <p className="text-sm text-muted-foreground">Project Owner • {owner.title}</p>
          </div>
        </div>

        {/* Approved Team Members */}
        {approvedRequests.map((member) => (
          <div key={member.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex-shrink-0">
              {member.profiles?.avatar_url ? (
                <img 
                  src={member.profiles.avatar_url} 
                  alt={member.profiles.name}
                  className="h-12 w-12 rounded-full"
                />
              ) : (
                <div className="h-12 w-12 bg-emerald-200 rounded-full flex items-center justify-center">
                  <span className="text-emerald-700 font-medium">
                    {member.profiles?.name?.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium">{member.profiles?.name}</h3>
              <p className="text-sm text-muted-foreground">Team Member • {member.profiles?.title}</p>
            </div>
          </div>
        ))}

        {/* Pending Requests - Only visible to owner */}
        {isOwner && pendingRequests.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Pending Requests</h3>
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-2">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {request.profiles?.avatar_url ? (
                      <img 
                        src={request.profiles.avatar_url} 
                        alt={request.profiles.name}
                        className="h-12 w-12 rounded-full"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-emerald-200 rounded-full flex items-center justify-center">
                        <span className="text-emerald-700 font-medium">
                          {request.profiles?.name?.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{request.profiles?.name}</h3>
                    <p className="text-sm text-muted-foreground">{request.profiles?.title}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateRequestStatus(request.id, 'approved')}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateRequestStatus(request.id, 'rejected')}
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};