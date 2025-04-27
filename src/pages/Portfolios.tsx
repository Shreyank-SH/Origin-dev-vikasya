import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { UploadPortfolioModal } from "@/components/modals/UploadPortfolioModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioCard } from "@/components/portfolios/PortfolioCard";

const Portfolios = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPortfolios = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const { data, error } = await supabase
        .from('portfolios')
        .select(`
          *,
          profiles:user_id (
            name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log("Fetched portfolios:", data);
      setPortfolios(data || []);
    } catch (error) {
      console.error("Error fetching portfolios:", error);
      toast({
        title: "Error",
        description: "Failed to load portfolios",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const filteredPortfolios = portfolios.filter(portfolio =>
    portfolio.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    portfolio.profiles.name.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h1 className="text-2xl font-bold text-sage-800">Portfolios</h1>
            <UploadPortfolioModal onSuccess={fetchPortfolios} />
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-sage-500" />
            <Input
              placeholder="Search portfolios..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPortfolios.map((portfolio) => (
              <PortfolioCard
                key={portfolio.id}
                portfolio={portfolio}
                currentUserId={currentUserId}
                onDelete={fetchPortfolios}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Portfolios;