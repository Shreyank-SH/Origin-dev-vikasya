import { AddProjectModal } from "@/components/modals/AddProjectModal";

export const ProjectsHeader = () => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-foreground">Projects</h1>
      <AddProjectModal />
    </div>
  );
};