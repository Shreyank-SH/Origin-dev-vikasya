import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
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

type UserRole = Database["public"]["Enums"]["user_role"];

export const UserManagementSection = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<{ [key: string]: UserRole }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", searchTerm],
    queryFn: async () => {
      console.log("Fetching users with search term:", searchTerm);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("name", `%${searchTerm}%`);

      if (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
      console.log("Fetched users:", data);
      return data;
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      console.log("Updating user role:", { userId, role });
      
      // Get the current user's auth ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Verify admin status
      const { data: adminProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (profileError || !adminProfile) {
        throw new Error("Unauthorized: User is not an admin");
      }

      const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId);

      if (error) throw error;

      // Log admin action
      const { error: logError } = await supabase
        .from("admin_actions")
        .insert({
          admin_id: adminProfile.id,
          action_type: "update_role",
          target_table: "profiles",
          target_id: userId,
          details: { new_role: role }
        });

      if (logError) {
        console.error("Error logging admin action:", logError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error in updateUserRole mutation:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      console.log("Deleting user:", userId);
      
      // Get the current user's auth ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Verify admin status
      const { data: adminProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (profileError || !adminProfile) {
        throw new Error("Unauthorized: User is not an admin");
      }

      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      // Log admin action
      const { error: logError } = await supabase
        .from("admin_actions")
        .insert({
          admin_id: adminProfile.id,
          action_type: "delete_user",
          target_table: "profiles",
          target_id: userId,
          details: { action: "deleted_user" }
        });

      if (logError) {
        console.error("Error logging admin action:", logError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error in deleteUser mutation:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Users className="h-5 w-5 mr-2" />
        User Management
      </h2>
      <div className="space-y-4">
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Select
                          value={selectedRole[user.id] || user.role}
                          onValueChange={(value) => setSelectedRole({ 
                            ...selectedRole, 
                            [user.id]: value as UserRole 
                          })}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="faculty">Faculty</SelectItem>
                            <SelectItem value="investor">Investor</SelectItem>
                            <SelectItem value="alumni">Alumni</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Change User Role</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to change {user.name}'s role to {selectedRole[user.id]}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => {
                            setSelectedRole({
                              ...selectedRole,
                              [user.id]: user.role
                            });
                          }}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              if (selectedRole[user.id]) {
                                updateUserRole.mutate({
                                  userId: user.id,
                                  role: selectedRole[user.id]
                                });
                              }
                            }}
                          >
                            Change Role
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {user.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteUser.mutate(user.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};