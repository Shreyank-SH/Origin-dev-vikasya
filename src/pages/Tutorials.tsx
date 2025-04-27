import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Play, Clock, Edit, Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddTutorialModal } from "@/components/modals/AddTutorialModal";
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

const Tutorials = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      return profile;
    },
  });

  const isAdmin = currentUser?.role === "admin";

  const { data: tutorials, isLoading } = useQuery({
    queryKey: ["tutorials", searchQuery],
    queryFn: async () => {
      console.log("Fetching tutorials...");
      const { data, error } = await supabase
        .from("tutorials")
        .select("*, profiles(name)")
        .ilike("title", `%${searchQuery}%`);

      if (error) {
        console.error("Error fetching tutorials:", error);
        toast({
          title: "Error",
          description: "Failed to load tutorials",
          variant: "destructive",
        });
        throw error;
      }

      console.log("Fetched tutorials:", data);
      return data;
    },
  });

  const deleteTutorial = useMutation({
    mutationFn: async (tutorialId: string) => {
      const { error } = await supabase
        .from("tutorials")
        .delete()
        .eq("id", tutorialId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorials"] });
      toast({
        title: "Success",
        description: "Tutorial deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error in deleteTutorial mutation:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-sage-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-sage-800">Tutorials</h1>
            {isAdmin && <AddTutorialModal />}
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-sage-500" />
            <Input
              placeholder="Search tutorials..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm h-[300px] animate-pulse"
                />
              ))
            ) : (
              tutorials?.map((tutorial) => (
                <div
                  key={tutorial.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative">
                    <div className="h-48 bg-sage-200">
                      {tutorial.video_url && (
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                          onClick={() => navigate(`/tutorials/${tutorial.id}`)}
                        >
                          <Play className="h-6 w-6 text-sage-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center space-x-2 text-sage-600 text-sm mb-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{tutorial.category || "General"}</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{tutorial.title}</h3>
                    <p className="text-sage-600 text-sm mb-4 line-clamp-2">
                      {tutorial.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-sage-500">
                        <Clock className="h-4 w-4" />
                        <span>By {tutorial.profiles?.name || "Anonymous"}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="text-sage-600 hover:text-sage-700"
                          onClick={() => navigate(`/tutorials/${tutorial.id}`)}
                        >
                          View Tutorial
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => navigate(`/tutorials/${tutorial.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="text-red-600"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Tutorial</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this tutorial? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteTutorial.mutate(tutorial.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Tutorials;