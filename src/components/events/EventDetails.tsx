import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

export function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState<any>(null);

  const { data: event, isLoading } = useQuery({
    queryKey: ['events', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profile:profiles(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const updateEvent = useMutation({
    mutationFn: async (updatedData: any) => {
      const { error } = await supabase
        .from('events')
        .update(updatedData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', id] });
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      navigate('/events');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (event) {
      setEditedEvent(event);
    }
  }, [event]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!event) {
    return <div>Event not found</div>;
  }

  const isOwner = user?.id === event.user_id;

  return (
    <div className="min-h-screen bg-sage-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/events')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
            {isOwner && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? "Cancel Edit" : "Edit Event"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteEvent.mutate()}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Event
                </Button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={editedEvent.title}
                    onChange={(e) => setEditedEvent({ ...editedEvent, title: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-sage-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editedEvent.date}
                    onChange={(e) => setEditedEvent({ ...editedEvent, date: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-sage-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    value={editedEvent.location}
                    onChange={(e) => setEditedEvent({ ...editedEvent, location: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-sage-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={editedEvent.description}
                    onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-sage-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registration URL</label>
                  <input
                    type="text"
                    value={editedEvent.registration_url}
                    onChange={(e) => setEditedEvent({ ...editedEvent, registration_url: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-sage-500"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => updateEvent.mutate(editedEvent)}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
              <p className="text-sage-600">Organized by {event.profile?.name}</p>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Date & Time</h2>
                  <p>{new Date(event.date).toLocaleString()}</p>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Location</h2>
                  <p>{event.location}</p>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Description</h2>
                  <p className="whitespace-pre-wrap">{event.description}</p>
                </div>
                {event.registration_url && (
                  <div className="pt-4">
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => window.open(event.registration_url, '_blank')}
                    >
                      Register Now
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
