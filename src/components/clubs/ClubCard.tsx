import { Button } from "@/components/ui/button";
import { Users, MessageSquare, Lock, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ClubCardProps {
  club: {
    id: string;
    name: string;
    description: string;
    banner_url: string | null;
    creator_id: string;
    is_private: boolean;
    _count?: {
      members: number;
      discussions: number;
    };
  };
  isMember: boolean;
  isCreator: boolean;
}

export function ClubCard({ club, isMember, isCreator }: ClubCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const joinRequest = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (club.is_private) {
        const { error } = await supabase
          .from('group_join_requests')
          .insert([
            { group_id: club.id, user_id: user.id }
          ]);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('group_members')
          .insert([
            { group_id: club.id, user_id: user.id }
          ]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: club.is_private ? "Join request sent successfully" : "Joined group successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div 
        className="h-32 bg-sage-200 bg-cover bg-center"
        style={club.banner_url ? { backgroundImage: `url(${club.banner_url})` } : undefined}
      />
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">{club.name}</h3>
          {club.is_private ? (
            <Lock className="h-4 w-4 text-sage-500" />
          ) : (
            <Globe className="h-4 w-4 text-sage-500" />
          )}
        </div>
        <p className="text-sage-600 text-sm mb-4 line-clamp-2">
          {club.description}
        </p>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-sm text-sage-500">
            <Users className="h-4 w-4" />
            <span>{club._count?.members || 0} members</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-sage-500">
            <MessageSquare className="h-4 w-4" />
            <span>{club._count?.discussions || 0} discussions</span>
          </div>
        </div>
        {isCreator ? (
          <Button 
            className="w-full bg-sage-600 hover:bg-sage-700"
            onClick={() => navigate(`/clubs/${club.id}`)}
          >
            Manage Club
          </Button>
        ) : isMember ? (
          <Button 
            className="w-full bg-sage-600 hover:bg-sage-700"
            onClick={() => navigate(`/clubs/${club.id}`)}
          >
            View Group
          </Button>
        ) : (
          <Button 
            className="w-full"
            variant="outline"
            onClick={() => joinRequest.mutate()}
            disabled={joinRequest.isPending}
          >
            {club.is_private ? 'Request to Join' : 'Join Group'}
          </Button>
        )}
      </div>
    </div>
  );
}