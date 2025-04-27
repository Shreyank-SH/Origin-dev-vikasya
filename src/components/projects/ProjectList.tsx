import { ProjectCard } from "./ProjectCard";

interface ProjectListProps {
  projects: any[];
  currentUserId?: string;
  onDelete?: () => void;
}

export const ProjectList = ({ projects, currentUserId, onDelete }: ProjectListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects?.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          currentUserId={currentUserId}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};