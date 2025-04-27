import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const TutorialDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [editedVideoUrl, setEditedVideoUrl] = useState("");

  const { data: tutorial, isLoading } = useQuery({
    queryKey: ["tutorial", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tutorials")
        .select("*, profiles(name)")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const updateTutorial = useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      category?: string;
      video_url?: string;
    }) => {
      const { error } = await supabase
        .from("tutorials")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Tutorial updated successfully",
      });
      setIsEditing(false);
    },
  });

  useEffect(() => {
    if (tutorial) {
      setEditedTitle(tutorial.title);
      setEditedContent(tutorial.content);
      setEditedCategory(tutorial.category || "");
      setEditedVideoUrl(tutorial.video_url || "");
    }
  }, [tutorial]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sage-50">
        <Navbar />
        <main className="container mx-auto px-4 pt-20">
          <div className="max-w-4xl mx-auto animate-pulse">
            <div className="h-8 bg-sage-200 rounded w-1/3 mb-4" />
            <div className="h-64 bg-sage-200 rounded mb-4" />
            <div className="h-4 bg-sage-200 rounded mb-2" />
            <div className="h-4 bg-sage-200 rounded w-2/3" />
          </div>
        </main>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="min-h-screen bg-sage-50">
        <Navbar />
        <main className="container mx-auto px-4 pt-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-sage-800">Tutorial not found</h1>
              <Button
                variant="ghost"
                onClick={() => navigate('/tutorials')}
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tutorials
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sage-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-20">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/tutorials')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tutorials
          </Button>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                {isEditing ? (
                  <div className="space-y-4 w-full">
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      placeholder="Tutorial title"
                    />
                    <Input
                      value={editedCategory}
                      onChange={(e) => setEditedCategory(e.target.value)}
                      placeholder="Category"
                    />
                    <Input
                      value={editedVideoUrl}
                      onChange={(e) => setEditedVideoUrl(e.target.value)}
                      placeholder="Video URL"
                      type="url"
                    />
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      placeholder="Tutorial content"
                      className="min-h-[200px]"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => updateTutorial.mutate({
                          title: editedTitle,
                          content: editedContent,
                          category: editedCategory,
                          video_url: editedVideoUrl,
                        })}
                      >
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-sage-800">{tutorial.title}</h1>
                  </>
                )}
              </div>

              {!isEditing && (
                <div className="space-y-6">
                  {tutorial.profiles?.name && (
                    <p className="text-sage-600">
                      Created by {tutorial.profiles.name}
                    </p>
                  )}

                  {tutorial.category && (
                    <div className="inline-block bg-sage-100 text-sage-800 px-3 py-1 rounded-full text-sm">
                      {tutorial.category}
                    </div>
                  )}

                  <div className="prose max-w-none">
                    <p className="text-sage-600 whitespace-pre-wrap">{tutorial.content}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TutorialDetails;
