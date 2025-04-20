import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, PlusCircle } from "lucide-react";
import TransactionForm from "@/components/transactions/TransactionForm";

const CsvUploadCard: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleFileUpload = async () => {
    if (!file || !user) return;

    try {
      // Directly use the session data
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session) {
        // Proceed with file upload logic
        console.log("File upload would happen here");
      }
    } catch (error) {
      console.error("File upload error:", error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files && event.target.files[0];
    setFile(selectedFile || null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Transactions</CardTitle>
        <CardDescription>Import your bank statement or CSV file</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="csv-upload"
        />
        <label htmlFor="csv-upload" className="inline-block">
          <Button onClick={handleFileUpload} disabled={!file}>
            <Upload className="mr-2 h-4 w-4" /> Upload CSV
          </Button>
        </label>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" /> Manual Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <TransactionForm closeDialog={() => setDialogOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CsvUploadCard;
