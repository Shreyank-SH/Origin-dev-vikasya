import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function EducationForm({ onSuccess }: { onSuccess: () => void }) {
  const [schoolName, setSchoolName] = useState("");
  const [preUniversityName, setPreUniversityName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('education')
        .insert({
          school_name: schoolName,
          pre_university_name: preUniversityName,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Education added successfully",
      });
      
      setSchoolName("");
      setPreUniversityName("");
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="school">School Name</Label>
        <Input
          id="school"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="preUniversity">Pre-University Name</Label>
        <Input
          id="preUniversity"
          value={preUniversityName}
          onChange={(e) => setPreUniversityName(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        Add Education
      </Button>
    </form>
  );
}