import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProjectHeaderProps {
  project: {
    id: string;
    title: string;
    category: string;
    banner_url: string | null;
    user_id: string;
  };
  isOwner: boolean;
  memberCount: number;
}

export const ProjectHeader = ({ project, isOwner, memberCount }: ProjectHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      {project.banner_url ? (
        <div 
          className="h-64 bg-cover bg-center rounded-lg mb-6" 
          style={{ backgroundImage: `url(${project.banner_url})` }}
        />
      ) : (
        <div className="h-64 bg-emerald-500 rounded-lg mb-6" />
      )}

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="mb-4">
              {project.category}
            </Badge>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        {isOwner && (
          <Button variant="outline" onClick={() => navigate(`/projects/${project.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Project
          </Button>
        )}
      </div>
    </div>
  );
};