import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Portfolio {
  id: string;
  title: string;
  description: string;
  file_url: string;
}

interface EditPortfolioModalProps {
  portfolio: Portfolio;
  onUpdate: () => void;
}

export function EditPortfolioModal({ portfolio, onUpdate }: EditPortfolioModalProps) {
  const [title, setTitle] = useState(portfolio.title);
  const [description, setDescription] = useState(portfolio.description);
  const [file, setFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setTitle(portfolio.title);
    setDescription(portfolio.description);
  }, [portfolio]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 50) {
      setTitle(value);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 200) {
      setDescription(value);
    }
  };

  const handleUpdate = async () => {
    if (!title || !description) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      let fileUrl = portfolio.file_url;

      if (file) {
        // Upload new file if provided
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('files')
          .upload(`portfolios/${fileName}`, file);

        if (uploadError) throw uploadError;
        
        // Get the full path
        const { data: { publicUrl } } = supabase.storage
          .from('files')
          .getPublicUrl(`portfolios/${fileName}`);
          
        fileUrl = `portfolios/${fileName}`;

        // Delete old file if it exists
        if (portfolio.file_url) {
          await supabase.storage
            .from('files')
            .remove([portfolio.file_url]);
        }
      }

      const { error: updateError } = await supabase
        .from('portfolios')
        .update({
          title,
          description,
          file_url: fileUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', portfolio.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Portfolio updated successfully",
      });
      setIsOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description: "Failed to update portfolio",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit2 className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Portfolio</DialogTitle>
          <DialogDescription>
            Update your portfolio details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="portfolio-title">
              Portfolio Title (max 50 characters)
            </Label>
            <Input 
              id="portfolio-title" 
              value={title}
              onChange={handleTitleChange}
              maxLength={50}
            />
            <p className="text-sm text-sage-600">
              {title.length}/50 characters
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Update Portfolio File (PDF)</Label>
            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {file ? (
              <p className="text-sm text-sage-600">
                New file selected: {file.name}
              </p>
            ) : (
              <p className="text-sm text-sage-600">
                Current file: {portfolio.file_url.split('/').pop()}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="portfolio-description">
              Description (max 200 characters)
            </Label>
            <Textarea
              id="portfolio-description"
              className="min-h-[100px]"
              value={description}
              onChange={handleDescriptionChange}
              maxLength={200}
            />
            <p className="text-sm text-sage-600">
              {description.length}/200 characters
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            className="bg-sage-600 hover:bg-sage-700"
            onClick={handleUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : "Update Portfolio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}