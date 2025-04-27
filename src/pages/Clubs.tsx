import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateGroupModal } from "@/components/modals/CreateGroupModal";
import { ClubCard } from "@/components/clubs/ClubCard";

const Clubs = () => {
  const [search, setSearch] = useState("");

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: clubs, isLoading } = useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      console.log("Fetching clubs...");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch clubs with member and discussion counts
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          members:group_members(count),
          discussions:discussions(count)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching clubs:", error);
        throw error;
      }

      // Fetch user's memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (membershipError) {
        console.error("Error fetching memberships:", membershipError);
        throw membershipError;
      }

      const membershipSet = new Set(memberships?.map(m => m.group_id));

      // Transform the data to include membership status and counts
      return data.map(club => ({
        ...club,
        isMember: membershipSet.has(club.id),
        isCreator: club.creator_id === user.id,
        _count: {
          members: club.members?.[0]?.count || 0,
          discussions: club.discussions?.[0]?.count || 0
        }
      }));
    },
  });

  const filteredClubs = clubs?.filter(club =>
    club.name.toLowerCase().includes(search.toLowerCase()) ||
    club.description.toLowerCase().includes(search.toLowerCase())
  );

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
                />
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
            <h1 className="text-2xl font-bold text-sage-800">Clubs</h1>
            <CreateGroupModal />
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-sage-500" />
            <Input
              placeholder="Search clubs..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs?.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                isMember={club.isMember}
                isCreator={club.isCreator}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Clubs;