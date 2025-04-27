import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Edit, Mail, MapPin, Building2, Calendar, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { EditProfileModal } from "@/components/modals/EditProfileModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioCard } from "@/components/portfolios/PortfolioCard";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { EducationForm } from "@/components/profile/EducationForm";
import { ExperienceForm } from "@/components/profile/ExperienceForm";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Profile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [currentUserId, setCurrentUserId] = useState<string>();
  const isOwnProfile = !id || id === currentUserId;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
    };
    getCurrentUser();
  }, []);

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', id || currentUserId],
    queryFn: async () => {
      console.log("Fetching profile for:", id || currentUserId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id || currentUserId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!currentUserId || !!id
  });

  // Fetch user's portfolios
  const { data: portfolios, isLoading: portfoliosLoading } = useQuery({
    queryKey: ['userPortfolios', id || currentUserId],
    queryFn: async () => {
      console.log("Fetching portfolios for:", id || currentUserId);
      const { data, error } = await supabase
        .from('portfolios')
        .select(`
          *,
          profiles:user_id (
            name,
            avatar_url
          )
        `)
        .eq('user_id', id || currentUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUserId || !!id
  });

  // Fetch user's projects
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['userProjects', id || currentUserId],
    queryFn: async () => {
      console.log("Fetching projects for:", id || currentUserId);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', id || currentUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUserId || !!id
  });

  // Fetch education
  const { data: education = [], isLoading: educationLoading } = useQuery({
    queryKey: ['education', id || currentUserId],
    queryFn: async () => {
      console.log("Fetching education for:", id || currentUserId);
      const { data, error } = await supabase
        .from('education')
        .select('*')
        .eq('user_id', id || currentUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUserId || !!id
  });

  // Fetch experiences
  const { data: experiences = [], isLoading: experiencesLoading } = useQuery({
    queryKey: ['experiences', id || currentUserId],
    queryFn: async () => {
      console.log("Fetching experiences for:", id || currentUserId);
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', id || currentUserId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUserId || !!id
  });

  const deleteEducation = useMutation({
    mutationFn: async (educationId: string) => {
      const { error } = await supabase
        .from('education')
        .delete()
        .eq('id', educationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education'] });
      toast({
        title: "Success",
        description: "Education entry deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteExperience = useMutation({
    mutationFn: async (experienceId: string) => {
      const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('id', experienceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      toast({
        title: "Success",
        description: "Experience entry deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (profileLoading || portfoliosLoading || projectsLoading || educationLoading || experiencesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-sage-50">
      <Navbar />
      <main className="pt-16">
        {/* Cover Image */}
        <div 
          className="h-32 md:h-64 bg-sage-200 transition-all duration-300 bg-cover bg-center"
          style={profile?.banner_url ? { backgroundImage: `url(${profile.banner_url})` } : {}}
        />

        {/* Back Button (when viewing other's profile) */}
        {!isOwnProfile && (
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        )}

        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="relative -mt-16 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
                  <div className="flex flex-col md:flex-row items-center md:space-x-4">
                    <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-sage-300 border-4 border-white shrink-0">
                      {profile?.avatar_url && (
                        <img 
                          src={profile.avatar_url} 
                          alt={profile.name || "Profile"} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      )}
                    </div>
                    <div className="text-center md:text-left mt-4 md:mt-0">
                      <h1 className="text-xl md:text-2xl font-bold text-sage-800">
                        {profile?.name || "No name set"}
                      </h1>
                      <p className="text-sage-600">{profile?.title || "No title set"}</p>
                    </div>
                  </div>
                  {isOwnProfile && <EditProfileModal />}
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-sage-600 mt-4">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="break-all">{profile?.email}</span>
                  </div>
                  {profile?.title && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{profile.title}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">About</h2>
              <p className="text-sage-600">
                {profile?.bio || "No bio added yet."}
              </p>
            </div>

            {/* Education Section */}
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Education</h2>
                {isOwnProfile && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Education
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Education</DialogTitle>
                      </DialogHeader>
                      <EducationForm 
                        onSuccess={() => {
                          queryClient.invalidateQueries({ queryKey: ['education'] });
                        }} 
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <div className="space-y-4">
                {education.length > 0 ? (
                  education.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-start border-b pb-4">
                      <div>
                        <h3 className="font-semibold">{edu.school_name}</h3>
                        {edu.pre_university_name && (
                          <p className="text-sage-600 text-sm">{edu.pre_university_name}</p>
                        )}
                      </div>
                      {isOwnProfile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEducation.mutate(edu.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sage-600">No education information added yet.</p>
                )}
              </div>
            </div>

            {/* Experience Section */}
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Experience</h2>
                {isOwnProfile && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Experience
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Experience</DialogTitle>
                      </DialogHeader>
                      <ExperienceForm 
                        onSuccess={() => {
                          queryClient.invalidateQueries({ queryKey: ['experiences'] });
                        }} 
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <div className="space-y-6">
                {experiences.length > 0 ? (
                  experiences.map((exp) => (
                    <div key={exp.id} className="flex justify-between items-start border-b pb-4">
                      <div>
                        <h3 className="font-semibold">{exp.position}</h3>
                        <p className="text-sage-600">{exp.organization}</p>
                        <p className="text-sage-500 text-sm">{exp.industry}</p>
                        <div className="flex items-center text-sm text-sage-500 mt-1">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(exp.start_date).toLocaleDateString()} - 
                          {exp.end_date ? new Date(exp.end_date).toLocaleDateString() : 'Present'}
                        </div>
                      </div>
                      {isOwnProfile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteExperience.mutate(exp.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sage-600">No experience information added yet.</p>
                )}
              </div>
            </div>

            {/* Portfolios Section */}
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Portfolios</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolios && portfolios.length > 0 ? (
                  portfolios.map((portfolio) => (
                    <PortfolioCard
                      key={portfolio.id}
                      portfolio={portfolio}
                      currentUserId={currentUserId}
                      onDelete={() => {
                        queryClient.invalidateQueries({ queryKey: ['userPortfolios'] });
                      }}
                    />
                  ))
                ) : (
                  <p className="text-sage-600 col-span-2">No portfolios yet.</p>
                )}
              </div>
            </div>

            {/* Projects Section */}
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects && projects.length > 0 ? (
                  projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      currentUserId={currentUserId}
                      onDelete={() => {
                        queryClient.invalidateQueries({ queryKey: ['userProjects'] });
                      }}
                    />
                  ))
                ) : (
                  <p className="text-sage-600 col-span-2">No projects yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;