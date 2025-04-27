import Navbar from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddOpportunityModal } from "@/components/modals/AddOpportunityModal";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const Opportunities = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id, // Only run query when we have a user ID
  });

  const { data: opportunities, isLoading: opportunitiesLoading } = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const isLoading = authLoading || profileLoading || opportunitiesLoading;
  const canCreateOpportunity = profile?.role && ["admin", "faculty", "investor", "alumni"].includes(profile.role);

  const filteredOpportunities = opportunities?.filter(
    (opportunity) =>
      opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opportunity.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-sage-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold text-sage-800">Opportunities</h1>
            {canCreateOpportunity && <AddOpportunityModal />}
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-sage-500" />
            <Input
              placeholder="Search opportunities..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div>Loading...</div>
            ) : filteredOpportunities?.length === 0 ? (
              <div className="text-center text-sage-600">No opportunities found</div>
            ) : (
              filteredOpportunities?.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Opportunities;