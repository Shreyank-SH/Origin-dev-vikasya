import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const BulkUploadSection = () => {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Starting file upload process");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from("bulk_user_uploads")
        .insert({
          admin_id: user.id,
          file_name: file.name,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      console.log("Created bulk upload record:", data);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploadId", data.id);

      console.log("Invoking bulk-upload function");
      const { data: functionData, error: functionError } = await supabase.functions.invoke('bulk-upload', {
        body: formData,
      });

      if (functionError) {
        console.error("Function error:", functionError);
        throw functionError;
      }

      console.log("Upload function response:", functionData);

      toast({
        title: "Success",
        description: "File uploaded successfully. Processing users...",
      });
      
      setFile(null);
    } catch (error: any) {
      console.error("Bulk upload error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Upload className="h-5 w-5 mr-2" />
        Bulk User Upload
      </h2>
      <div className="space-y-4">
        <Input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <p className="text-sm text-muted-foreground">
          Upload an Excel file (.xlsx or .xls) with the following columns:
          email, name, role (student/faculty/investor/alumni), password
        </p>
        <Button onClick={handleFileUpload} disabled={!file}>
          Upload and Process
        </Button>
      </div>
    </div>
  );
};