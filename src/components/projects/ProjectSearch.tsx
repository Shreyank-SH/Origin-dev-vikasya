import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProjectSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const ProjectSearch = ({ searchTerm, setSearchTerm }: ProjectSearchProps) => {
  return (
    <div className="relative mb-6">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search projects..."
        className="pl-10"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};