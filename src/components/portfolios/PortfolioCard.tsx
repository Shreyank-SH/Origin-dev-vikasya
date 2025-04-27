import { FileText, Eye, Download, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditPortfolioModal } from "@/components/modals/EditPortfolioModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Portfolio {
  id: string;
  title: string;
  description: string;
  file_url: string;
  user_id: string;
  created_at: string;
  profiles: {
    name: string;
    avatar_url: string | null;
  };
}

interface PortfolioCardProps {
  portfolio: Portfolio;
  currentUserId: string | null;
  onDelete: () => void;
}

export const PortfolioCard = ({ portfolio, currentUserId, onDelete }: PortfolioCardProps) => {
  const { toast } = useToast();
  const isOwner = currentUserId === portfolio.user_id;

  const handlePreview = async () => {
    try {
      const { data } = await supabase.storage
        .from('files')
        .getPublicUrl(portfolio.file_url);

      window.open(data.publicUrl, '_blank');
    } catch (error) {
      console.error("Error previewing file:", error);
      toast({
        title: "Error",
        description: "Failed to preview portfolio",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    try {
      const { data } = await supabase.storage
        .from('files')
        .getPublicUrl(portfolio.file_url);

      const link = document.createElement('a');
      link.href = data.publicUrl;
      link.download = `${portfolio.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Error",
        description: "Failed to download portfolio",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      // Delete file from storage
      if (portfolio.file_url) {
        const { error: deleteFileError } = await supabase.storage
          .from('files')
          .remove([portfolio.file_url]);

        if (deleteFileError) throw deleteFileError;
      }

      // Delete portfolio record
      const { error: deletePortfolioError } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', portfolio.id);

      if (deletePortfolioError) throw deletePortfolioError;

      toast({
        title: "Success",
        description: "Portfolio deleted successfully",
      });
      onDelete();
    } catch (error) {
      console.error("Error deleting portfolio:", error);
      toast({
        title: "Error",
        description: "Failed to delete portfolio",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-12 w-12 rounded-full bg-sage-200 flex items-center justify-center">
            {portfolio.profiles.avatar_url ? (
              <img
                src={portfolio.profiles.avatar_url}
                alt={portfolio.profiles.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <FileText className="h-6 w-6 text-sage-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold">{portfolio.profiles.name}</h3>
            <p className="text-sm text-sage-600">
              {format(new Date(portfolio.created_at), 'PPP')}
            </p>
          </div>
          {isOwner && (
            <div className="ml-auto flex space-x-2">
              <EditPortfolioModal 
                portfolio={portfolio} 
                onUpdate={onDelete}
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Portfolio</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this portfolio? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={handleDelete}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
        <CardTitle className="text-xl truncate">{portfolio.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm line-clamp-3">
          {portfolio.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button 
          variant="outline"
          onClick={handlePreview}
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button 
          variant="outline"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );
};