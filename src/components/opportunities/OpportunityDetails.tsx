import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Calendar, Link as LinkIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OpportunityDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    description: "",
    deadline: "",
    application_link: "",
  });

  const { data: opportunity, isLoading } = useQuery({
    queryKey: ["opportunity", id],
    queryFn: async () => {
      if (!id) throw new Error("No opportunity ID provided");
      
      const { data, error } = await supabase
        .from("opportunities")
        .select(`
          *,
          profiles:user_id (
            name,
            role
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      
      // Initialize form data when opportunity is loaded
      if (data) {
        setFormData({
          title: data.title,
          type: data.type,
          description: data.description,
          deadline: data.deadline ? data.deadline.split('T')[0] : "",
          application_link: data.application_link || "",
        });
      }
      
      return data;
    },
  });

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from("opportunities")
        .update({
          title: formData.title,
          type: formData.type,
          description: formData.description,
          deadline: formData.deadline,
          application_link: formData.application_link,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Opportunity updated successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["opportunity", id] });
    } catch (error: any) {
      console.error("Error updating opportunity:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update opportunity",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!opportunity) {
    return <div>Opportunity not found</div>;
  }

  const isOwner = user?.id === opportunity.user_id;
  const isExpired = opportunity.deadline ? new Date(opportunity.deadline) < new Date() : false;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/opportunities')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Opportunities
        </Button>
      </div>

      <div className="flex justify-between items-start mb-6">
        {isEditing ? (
          <div className="w-full">
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-2xl font-bold mb-4"
            />
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="job">Job</SelectItem>
                <SelectItem value="mentorship">Mentorship</SelectItem>
                <SelectItem value="funding">Funding</SelectItem>
                <SelectItem value="gig">Gig</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <h1 className="text-3xl font-bold text-sage-800">{opportunity.title}</h1>
        )}
        {isOwner && !isEditing && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                const { error } = await supabase
                  .from("opportunities")
                  .delete()
                  .eq("id", id);

                if (error) {
                  toast({
                    title: "Error",
                    description: "Failed to delete opportunity",
                    variant: "destructive",
                  });
                } else {
                  toast({
                    title: "Success",
                    description: "Opportunity deleted successfully",
                  });
                  navigate("/opportunities");
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-sage-600 hover:bg-sage-700"
              onClick={handleUpdate}
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {isEditing ? (
          <>
            <div className="space-y-4">
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
              <Input
                type="url"
                placeholder="Application Link"
                value={formData.application_link}
                onChange={(e) => setFormData({ ...formData, application_link: e.target.value })}
              />
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[200px]"
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center text-sage-600">
              <Calendar className="h-5 w-5 mr-2" />
              {opportunity.deadline ? (
                <span>
                  Deadline: {format(new Date(opportunity.deadline), "PPP")}
                  {isExpired && (
                    <span className="ml-2 text-red-500 font-medium">(Closed)</span>
                  )}
                </span>
              ) : (
                <span>No deadline specified</span>
              )}
            </div>

            <div className="prose max-w-none">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="whitespace-pre-wrap">{opportunity.description}</p>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold">Posted by</h2>
              <div className="flex items-center gap-2">
                <span className="font-medium">{opportunity.profiles.name}</span>
                <span className="text-sage-500">({opportunity.profiles.role})</span>
              </div>
            </div>

            {!isExpired && opportunity.application_link && (
              <div className="mt-8">
                <Button 
                  className="w-full sm:w-auto bg-sage-600 hover:bg-sage-700"
                  onClick={() => window.open(opportunity.application_link, '_blank')}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Apply Now
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}