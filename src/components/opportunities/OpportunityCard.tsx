import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Briefcase, Building2, GraduationCap, Calendar, Link as LinkIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface OpportunityCardProps {
  opportunity: {
    id: string;
    title: string;
    type: string;
    description: string;
    deadline: string | null;
    created_at: string;
    application_link?: string;
  };
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const navigate = useNavigate();
  const isExpired = opportunity.deadline ? new Date(opportunity.deadline) < new Date() : false;

  const getIcon = () => {
    switch (opportunity.type) {
      case 'internship':
        return <Briefcase className="h-6 w-6 text-sage-600" />;
      case 'job':
        return <Building2 className="h-6 w-6 text-sage-600" />;
      case 'mentorship':
      case 'funding':
      default:
        return <GraduationCap className="h-6 w-6 text-sage-600" />;
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/opportunities/${opportunity.id}`)}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex items-start space-x-4 w-full sm:w-auto">
          <div className="p-3 bg-sage-100 rounded-lg shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{opportunity.title}</h3>
            <p className="text-sage-600 text-sm mb-2 line-clamp-2">
              {opportunity.description}
            </p>
            <div className="flex flex-wrap gap-2 text-sm text-sage-500">
              <span className="capitalize">{opportunity.type}</span>
              <span>•</span>
              <span>Posted: {formatDistanceToNow(new Date(opportunity.created_at))} ago</span>
              {opportunity.deadline && (
                <>
                  <span>•</span>
                  <span className={isExpired ? "text-red-500" : "text-green-500"}>
                    {isExpired ? "Closed" : "Open"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}