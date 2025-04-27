import { useState } from "react";
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
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UploadPortfolioModalProps {
  onSuccess?: () => void;
}

export function UploadPortfolioModal({ onSuccess }: UploadPortfolioModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

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

  const handleUpload = async () => {
    if (!title || !description || !file) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Upload file
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('files')
        .upload(`portfolios/${fileName}`, file);

      if (uploadError) throw uploadError;

      // Create portfolio entry
      const { error: insertError } = await supabase
        .from('portfolios')
        .insert({
          title,
          description,
          file_url: data.path,
          user_id: user.id,
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Portfolio uploaded successfully",
      });
      setIsOpen(false);
      setTitle("");
      setDescription("");
      setFile(null);
      onSuccess?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload portfolio",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-sage-600 hover:bg-sage-700">
          <Plus className="h-4 w-4 mr-2" />
          Upload Portfolio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Upload Portfolio</DialogTitle>
          <DialogDescription>
            Upload your portfolio in PDF format.
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
            <Label>Upload Portfolio (PDF)</Label>
            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {file && (
              <p className="text-sm text-sage-600">
                Selected file: {file.name}
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
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Portfolio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}