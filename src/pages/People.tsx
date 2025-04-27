import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Mail, Link2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const People = () => {
  const [search, setSearch] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch all profiles
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          portfolios (id)
        `);

      if (error) throw error;
      return data;
    },
  });

  const filteredProfiles = profiles?.filter(
    (profile) =>
      profile.name?.toLowerCase().includes(search.toLowerCase()) ||
      profile.role?.toLowerCase().includes(search.toLowerCase())
  );

  const handleContact = async (profile: any) => {
    if (!profile.email) {
      setAlertMessage("This user hasn't added their contact information yet.");
      setShowAlert(true);
      return;
    }
    window.location.href = `mailto:${profile.email}`;
  };

  const handleProfile = (profile: any) => {
    navigate(`/profile/${profile.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sage-50">
        <Navbar />
        <main className="container mx-auto px-4 pt-20">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg h-48 shadow-sm"
                ></div>
              ))}
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
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-sage-800">People</h1>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-sage-500" />
            <Input
              placeholder="Search people..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles?.map((profile) => (
              <div
                key={profile.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div 
                  className="h-32 bg-sage-200 bg-cover bg-center"
                  style={{
                    backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : 'none'
                  }}
                />
                <div className="relative px-4 pt-12 pb-4">
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
                    <Avatar className="h-20 w-20 border-4 border-white">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback className="bg-sage-300">
                        {profile.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-lg">{profile.name}</h3>
                    <p className="text-sage-600 text-sm capitalize">
                      {profile.role}
                    </p>
                    {profile.title && (
                      <p className="text-sage-500 text-sm">{profile.title}</p>
                    )}
                  </div>
                  <div className="flex justify-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-sage-600"
                      onClick={() => handleContact(profile)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-sage-600"
                      onClick={() => handleProfile(profile)}
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Information Not Available
            </AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default People;