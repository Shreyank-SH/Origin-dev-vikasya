import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export function EventRegistrationModal() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const { id: eventId } = useParams();
  const queryClient = useQueryClient();

  const handleRegister = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to register for events.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("event_registrations")
        .insert({
          event_id: eventId,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Registration Successful!",
        description: "You have successfully registered for this event.",
      });

      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setIsOpen(false);
    } catch (error) {
      console.error("Error registering for event:", error);
      toast({
        title: "Registration Failed",
        description: "There was an error registering for the event. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-sage-600 hover:bg-sage-700">
          Register Now
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Event Registration</DialogTitle>
          <DialogDescription>
            Confirm your registration for this event.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-sage-600">
            By registering, you agree to attend this event and receive updates about it.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            className="bg-sage-600 hover:bg-sage-700"
            onClick={handleRegister}
          >
            <Check className="h-4 w-4 mr-2" />
            Confirm Registration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}