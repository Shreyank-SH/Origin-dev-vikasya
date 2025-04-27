import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const PendingApprovalsSection = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ["pendingUsers"],
    queryFn: async () => {
      console.log("Fetching pending users");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_approved", false);

      if (error) {
        console.error("Error fetching pending users:", error);
        throw error;
      }
      console.log("Pending users:", data);
      return data;
    },
  });

  const approveUser = useMutation({
    mutationFn: async (userId: string) => {
      console.log("Approving user:", userId);
      
      // Get the current user's auth ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // First verify this user is an admin
      const { data: adminProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (profileError) {
        console.error("Error getting admin profile:", profileError);
        throw new Error("Failed to verify admin status");
      }

      if (!adminProfile) {
        throw new Error("Unauthorized: User is not an admin");
      }

      // Now that we've verified admin status, update the user's approval
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ is_approved: true })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating user approval:", updateError);
        throw updateError;
      }

      console.log("Successfully updated user approval");
      
      // Log the admin action
      const { error: logError } = await supabase
        .from("admin_actions")
        .insert({
          admin_id: adminProfile.id,
          action_type: "approve_user",
          target_table: "profiles",
          target_id: userId,
          details: { action: "approved_user" }
        });

      if (logError) {
        console.error("Error logging admin action:", logError);
        // Don't throw here - the main action succeeded
        console.warn("Failed to log admin action but user was approved");
      } else {
        console.log("Successfully logged admin action");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingUsers"] });
      toast({
        title: "Success",
        description: "User approved successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error in approveUser mutation:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Loading pending approvals...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        Pending Approvals
      </h2>
      <div className="space-y-4">
        {pendingUsers?.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 bg-sage-50 rounded-lg"
          >
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-sage-600">{user.email}</p>
              <p className="text-sm text-sage-500 capitalize">{user.role}</p>
            </div>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-green-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve User</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to approve {user.name}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => approveUser.mutate(user.id)}
                    >
                      Approve
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
        {pendingUsers?.length === 0 && (
          <p className="text-center text-sage-500">
            No pending approvals
          </p>
        )}
      </div>
    </div>
  );
};