import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

export const AddUserSection = () => {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    role: "" as UserRole,
  });
  const { toast } = useToast();

  const handleAddUser = async () => {
    try {
      console.log("Starting direct user addition process");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("No authenticated user");

      // First verify this user is an admin
      const { data: adminProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (profileError || !adminProfile) {
        throw new Error("Unauthorized: User is not an admin");
      }

      // Call the process_user_upload function
      const { data, error } = await supabase.rpc('process_user_upload', {
        p_email: formData.email,
        p_password: formData.password,
        p_name: formData.name,
        p_role: formData.role,
      });

      if (error) throw error;

      console.log("User added successfully:", data);

      // Log the admin action
      const { error: logError } = await supabase
        .from("admin_actions")
        .insert({
          admin_id: adminProfile.id,
          action_type: "add_user",
          target_table: "profiles",
          target_id: data,
          details: { action: "added_user", email: formData.email }
        });

      if (logError) {
        console.error("Error logging admin action:", logError);
      }

      toast({
        title: "Success",
        description: "User added successfully",
      });

      // Reset form
      setFormData({
        email: "",
        name: "",
        password: "",
        role: "" as UserRole,
      });

    } catch (error: any) {
      console.error("Error adding user:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <UserPlus className="h-5 w-5 mr-2" />
        Add User
      </h2>
      <div className="space-y-4">
        <Input
          placeholder="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <Input
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <Input
          placeholder="Password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
        >
          <SelectTrigger>
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
        <Button 
          onClick={handleAddUser}
          disabled={!formData.email || !formData.name || !formData.password || !formData.role}
        >
          Add User
        </Button>
      </div>
    </div>
  );
};