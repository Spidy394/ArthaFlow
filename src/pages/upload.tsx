import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from 'uuid';

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Icons
import { Upload, FileText, Check, AlertCircle, Loader2, Download, ArrowRight, Database, RefreshCw } from "lucide-react";

// Layouts
import DashboardLayout from "@/components/layouts/DashboardLayout";

// Define the expected CSV format structure
interface CsvTransaction {
  date: string;
  description: string;
  amount: string;
  category: string;
  type: string;
  [key: string]: string; // Allow additional fields
}

// Define the database transaction structure
interface DbTransaction {
  id: string;
  transaction_date: string;
  description: string | null;
  amount: number;
  category: string;
  type: string;
  user_id: string;
  created_at: string;
}

// Bank template definitions
interface BankTemplate {
  id: string;
  name: string;
  headers: {
    date: string;
    description: string;
    amount: string;
    category?: string;
    type?: string;
  };
  dateFormat: string;
}

// Predefined bank templates
const bankTemplates: BankTemplate[] = [
  {
    id: "generic",
    name: "Generic Format",
    headers: {
      date: "date",
      description: "description",
      amount: "amount",
      category: "category",
      type: "type"
    },
    dateFormat: "YYYY-MM-DD"
  },
  {
    id: "chase",
    name: "Chase Bank",
    headers: {
      date: "transaction_date",
      description: "description",
      amount: "amount",
      type: "transaction_type"
    },
    dateFormat: "MM/DD/YYYY"
  },
  {
    id: "bankofamerica",
    name: "Bank of America",
    headers: {
      date: "date",
      description: "description",
      amount: "amount",
    },
    dateFormat: "MM/DD/YYYY"
  },
  {
    id: "wells_fargo",
    name: "Wells Fargo",
    headers: {
      date: "date",
      description: "description",
      amount: "amount",
    },
    dateFormat: "MM/DD/YYYY"
  },
  {
    id: "hsbc",
    name: "HSBC",
    headers: {
      date: "date",
      description: "description",
      amount: "amount",
    },
    dateFormat: "DD/MM/YYYY"
  },
];

// Form schema for column mapping
const columnMappingSchema = z.object({
  dateColumn: z.string().min(1, "Date column is required"),
  amountColumn: z.string().min(1, "Amount column is required"),
  descriptionColumn: z.string().min(1, "Description column is required"),
  categoryColumn: z.string().optional(),
  typeColumn: z.string().optional(),
  dateFormat: z.enum(["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY"]),
  defaultCategory: z.string().optional(),
  defaultType: z.enum(["income", "expense"]).optional()
});

const Upload: React.FC = () => {
  const [uploadMode, setUploadMode] = useState<'standard' | 'advanced'>('standard');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'parsing' | 'mapping' | 'preview' | 'inserting' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [parsedData, setParsedData] = useState<CsvTransaction[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("generic");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Record<number, boolean>>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Form for column mapping
  const form = useForm<z.infer<typeof columnMappingSchema>>({
    resolver: zodResolver(columnMappingSchema),
    defaultValues: {
      dateColumn: "",
      amountColumn: "",
      descriptionColumn: "",
      categoryColumn: "",
      typeColumn: "",
      dateFormat: "YYYY-MM-DD",
      defaultCategory: "Uncategorized",
      defaultType: "expense"
    }
  });

  // Set form values when template changes
  useEffect(() => {
    if (csvHeaders.length > 0) {
      const template = bankTemplates.find(t => t.id === selectedTemplate);
      if (template) {
        // Try to find matching headers in the CSV
        const dateCol = findBestMatchingHeader(csvHeaders, template.headers.date);
        const amountCol = findBestMatchingHeader(csvHeaders, template.headers.amount);
        const descriptionCol = findBestMatchingHeader(csvHeaders, template.headers.description);
        const categoryCol = template.headers.category ? 
          findBestMatchingHeader(csvHeaders, template.headers.category) : "";
        const typeCol = template.headers.type ? 
          findBestMatchingHeader(csvHeaders, template.headers.type) : "";
        
        form.reset({
          dateColumn: dateCol || "",
          amountColumn: amountCol || "",
          descriptionColumn: descriptionCol || "",
          categoryColumn: categoryCol || "",
          typeColumn: typeCol || "",
          dateFormat: template.dateFormat,
          defaultCategory: "Uncategorized",
          defaultType: "expense"
        });
      }
    }
  }, [selectedTemplate, csvHeaders]);

  // Find best matching header based on similarity
  const findBestMatchingHeader = (headers: string[], targetHeader: string): string => {
    const normalizedTarget = targetHeader.toLowerCase().replace(/[_\s]/g, '');
    
    // First try exact match
    const exactMatch = headers.find(h => 
      h.toLowerCase().replace(/[_\s]/g, '') === normalizedTarget
    );
    
    if (exactMatch) return exactMatch;
    
    // Then try partial match
    const partialMatch = headers.find(h => 
      h.toLowerCase().replace(/[_\s]/g, '').includes(normalizedTarget) ||
      normalizedTarget.includes(h.toLowerCase().replace(/[_\s]/g, ''))
    );
    
    return partialMatch || "";
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Check if the file is a CSV
    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file format",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }
    
    setFile(file);
    setUploadStatus('idle');
    setErrorMessage("");
    setParsedData([]);
    setCsvHeaders([]);
    setCsvData([]);
    setSelectedTransactions({});
  };

  // Parse raw CSV text
  const parseRawCSV = (text: string): { headers: string[], data: string[][] } => {
    // Split the text into lines and remove empty lines
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
      throw new Error("CSV file must contain at least a header row and one data row");
    }
    
    // Parse header line
    const headerLine = lines[0];
    const headers = parseCsvLine(headerLine);
    
    // Parse data rows
    const data: string[][] = [];
    for (let i = 1; i < lines.length; i++) {
      const rowData = parseCsvLine(lines[i]);
      if (rowData.length === headers.length) {
        data.push(rowData);
      }
    }
    
    return { headers, data };
  };
  
  // Helper to parse CSV line handling quoted values with commas
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result.map(val => val.replace(/^"|"$/g, '').trim());
  };

  // Map CSV to transactions
  const mapCsvToTransactions = (
    headers: string[], 
    data: string[][], 
    mapping: z.infer<typeof columnMappingSchema>
  ): CsvTransaction[] => {
    const dateIdx = headers.indexOf(mapping.dateColumn);
    const amountIdx = headers.indexOf(mapping.amountColumn);
    const descriptionIdx = headers.indexOf(mapping.descriptionColumn);
    const categoryIdx = mapping.categoryColumn ? headers.indexOf(mapping.categoryColumn) : -1;
    const typeIdx = mapping.typeColumn ? headers.indexOf(mapping.typeColumn) : -1;
    
    const transactions: CsvTransaction[] = [];
    
    data.forEach((row) => {
      const transaction: CsvTransaction = {
        date: dateIdx >= 0 ? row[dateIdx] : '',
        amount: amountIdx >= 0 ? row[amountIdx] : '',
        description: descriptionIdx >= 0 ? row[descriptionIdx] : '',
        category: categoryIdx >= 0 ? row[categoryIdx] : mapping.defaultCategory || 'Uncategorized',
        type: typeIdx >= 0 ? row[typeIdx] : mapping.defaultType || 'expense',
      };
      
      // Add all columns as additional data
      headers.forEach((header, idx) => {
        if (idx !== dateIdx && idx !== amountIdx && idx !== descriptionIdx && 
            idx !== categoryIdx && idx !== typeIdx) {
          transaction[header] = row[idx];
        }
      });
      
      transactions.push(transaction);
    });
    
    return transactions;
  };

  // Validate parsed data
  const validateTransactions = (transactions: CsvTransaction[], dateFormat: string): string[] => {
    const errors: string[] = [];
    
    transactions.forEach((transaction, index) => {
      // Validate date format
      const date = parseDate(transaction.date, dateFormat);
      if (!date) {
        errors.push(`Row ${index + 1}: Invalid date format "${transaction.date}"`);
      }
      
      // Validate amount is a number
      const amount = parseFloat(transaction.amount.replace(/[^\d.-]/g, ''));
      if (isNaN(amount)) {
        errors.push(`Row ${index + 1}: Invalid amount "${transaction.amount}"`);
      }
      
      // Check for missing description
      if (!transaction.description.trim()) {
        errors.push(`Row ${index + 1}: Missing description`);
      }
    });
    
    return errors;
  };

  // Parse date based on format
  const parseDate = (dateStr: string, format: string): Date | null => {
    let day, month, year;
    
    // Remove any non-numeric characters except for separators
    const cleanDateStr = dateStr.replace(/[^\d/.-]/g, '');
    const parts = cleanDateStr.split(/[-/.]/);
    
    if (parts.length !== 3) return null;
    
    switch (format) {
      case 'YYYY-MM-DD':
        year = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
        day = parseInt(parts[2]);
        break;
      case 'MM/DD/YYYY':
        month = parseInt(parts[0]) - 1;
        day = parseInt(parts[1]);
        year = parseInt(parts[2]);
        break;
      case 'DD/MM/YYYY':
        day = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
        year = parseInt(parts[2]);
        break;
      default:
        return null;
    }
    
    const date = new Date(year, month, day);
    return date.getFullYear() === year && 
           date.getMonth() === month && 
           date.getDate() === day ? date : null;
  };

  // Process the uploaded file
  const processFile = async () => {
    if (!file) return;
    
    setUploadStatus('parsing');
    setProgress(10);
    
    try {
      // Read file content
      const text = await file.text();
      setProgress(30);
      
      // Parse CSV
      const { headers, data } = parseRawCSV(text);
      setCsvHeaders(headers);
      setCsvData(data);
      setProgress(50);
      
      if (uploadMode === 'standard') {
        // Use template mapping
        const template = bankTemplates.find(t => t.id === selectedTemplate);
        if (!template) throw new Error("Selected template not found");
        
        const transactions = mapCsvToTransactions(headers, data, {
          dateColumn: findBestMatchingHeader(headers, template.headers.date),
          amountColumn: findBestMatchingHeader(headers, template.headers.amount),
          descriptionColumn: findBestMatchingHeader(headers, template.headers.description),
          categoryColumn: template.headers.category ? 
            findBestMatchingHeader(headers, template.headers.category) : undefined,
          typeColumn: template.headers.type ? 
            findBestMatchingHeader(headers, template.headers.type) : undefined,
          dateFormat: template.dateFormat,
          defaultCategory: "Uncategorized",
          defaultType: "expense"
        });
        
        const errors = validateTransactions(transactions, template.dateFormat);
        setValidationErrors(errors);
        
        if (errors.length === 0) {
          setParsedData(transactions);
          setUploadStatus('preview');
        } else {
          setUploadStatus('error');
        }
      } else {
        setUploadStatus('mapping');
      }
      
      setProgress(100);
    } catch (error: any) {
      setErrorMessage(error.message);
      setUploadStatus('error');
      setProgress(0);
    }
  };

  // Handle column mapping submission
  const onSubmitMapping = async (values: z.infer<typeof columnMappingSchema>) => {
    try {
      const transactions = mapCsvToTransactions(csvHeaders, csvData, values);
      const errors = validateTransactions(transactions, values.dateFormat);
      setValidationErrors(errors);
      
      if (errors.length === 0) {
        setParsedData(transactions);
        setUploadStatus('preview');
      } else {
        setUploadStatus('error');
      }
    } catch (error: any) {
      setErrorMessage(error.message);
      setUploadStatus('error');
    }
  };

  // Import transactions to database
  const importTransactions = async () => {
    if (!parsedData.length) return;
    
    setUploadStatus('inserting');
    setProgress(0);
    
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error("User not authenticated");
      
      const transactions: DbTransaction[] = parsedData.map((t, idx) => {
        if (!selectedTransactions[idx] && Object.keys(selectedTransactions).length > 0) {
          return null;
        }
        
        const amount = parseFloat(t.amount.replace(/[^\d.-]/g, ''));
        return {
          id: uuidv4(),
          transaction_date: new Date(t.date).toISOString(),
          description: t.description,
          amount: t.type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
          category: t.category,
          type: t.type,
          user_id: user.data.user.id,
          created_at: new Date().toISOString()
        };
      }).filter(Boolean) as DbTransaction[];
      
      const { error } = await supabase
        .from('transactions')
        .insert(transactions);
      
      if (error) throw error;
      
      setUploadStatus('success');
      toast({
        title: "Import successful",
        description: `${transactions.length} transactions imported successfully.`,
      });
      
      // Navigate to transactions page after short delay
      setTimeout(() => navigate('/transactions'), 2000);
    } catch (error: any) {
      setErrorMessage(error.message);
      setUploadStatus('error');
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Import Transactions</CardTitle>
            <CardDescription>
              Upload your bank statement or transaction data in CSV format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={uploadMode} onValueChange={(value) => setUploadMode(value as 'standard' | 'advanced')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="standard">Standard Upload</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Mapping</TabsTrigger>
              </TabsList>

              {/* Standard Upload Tab */}
              <TabsContent value="standard">
                {uploadStatus === 'idle' && (
                  <div className="space-y-4">
                    <Select
                      value={selectedTemplate}
                      onValueChange={setSelectedTemplate}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center ${
                        isDragging ? 'border-primary bg-primary/10' : 'border-muted'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-lg font-semibold">
                        Drag and drop your CSV file here
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        or click to browse
                      </p>
                      <Input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileInput}
                        id="file-upload"
                      />
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        Select File
                      </Button>
                    </div>

                    {file && (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <FileText className="h-6 w-6" />
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button onClick={() => processFile()}>
                          Process File
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Advanced Mapping Tab */}
              <TabsContent value="advanced">
                {uploadStatus === 'idle' && (
                  <div className="space-y-4">
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center ${
                        isDragging ? 'border-primary bg-primary/10' : 'border-muted'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-lg font-semibold">
                        Drag and drop your CSV file here
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        or click to browse for custom column mapping
                      </p>
                      <Input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileInput}
                        id="file-upload-advanced"
                      />
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => document.getElementById('file-upload-advanced')?.click()}
                      >
                        Select File
                      </Button>
                    </div>

                    {file && (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <FileText className="h-6 w-6" />
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button onClick={() => processFile()}>
                          Process File
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Form implementation for custom column mapping */}
                {uploadStatus === 'mapping' && (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitMapping)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="dateColumn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Column</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select column for date" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {csvHeaders.map(header => (
                                  <SelectItem key={header} value={header}>
                                    {header}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="amountColumn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount Column</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select column for amount" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {csvHeaders.map(header => (
                                  <SelectItem key={header} value={header}>
                                    {header}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="descriptionColumn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description Column</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select column for description" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {csvHeaders.map(header => (
                                  <SelectItem key={header} value={header}>
                                    {header}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="categoryColumn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category Column (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select column for category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">None (Use Default)</SelectItem>
                                {csvHeaders.map(header => (
                                  <SelectItem key={header} value={header}>
                                    {header}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="typeColumn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transaction Type Column (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select column for transaction type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">None (Use Default)</SelectItem>
                                {csvHeaders.map(header => (
                                  <SelectItem key={header} value={header}>
                                    {header}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="dateFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Format</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select date format" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="defaultCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Category</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Uncategorized" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="defaultType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Transaction Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select default type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="expense">Expense</SelectItem>
                                <SelectItem value="income">Income</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full">
                        Preview Transactions
                      </Button>
                    </form>
                  </Form>
                )}
              </TabsContent>
            </Tabs>

            {/* Progress indicator */}
            {(uploadStatus === 'parsing' || uploadStatus === 'inserting') && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-muted-foreground">
                  {uploadStatus === 'parsing' ? 'Processing file...' : 'Importing transactions...'}
                </p>
              </div>
            )}

            {/* Error display */}
            {uploadStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {errorMessage || 'An error occurred while processing the file.'}
                  {validationErrors.length > 0 && (
                    <ul className="mt-2 list-disc list-inside">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Transaction preview */}
            {uploadStatus === 'preview' && parsedData.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Preview Transactions</h3>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedTransactions({})}
                    >
                      Clear Selection
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newSelected = {};
                        parsedData.forEach((_, idx) => {
                          newSelected[idx] = true;
                        });
                        setSelectedTransactions(newSelected);
                      }}
                    >
                      Select All
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[400px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={
                              Object.keys(selectedTransactions).length ===
                              parsedData.length
                            }
                            onCheckedChange={(checked) => {
                              const newSelected = {};
                              if (checked) {
                                parsedData.forEach((_, idx) => {
                                  newSelected[idx] = true;
                                });
                              }
                              setSelectedTransactions(newSelected);
                            }}
                          />
                        </TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((transaction, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Checkbox
                              checked={selectedTransactions[index]}
                              onCheckedChange={(checked) => {
                                setSelectedTransactions({
                                  ...selectedTransactions,
                                  [index]: checked,
                                });
                              }}
                            />
                          </TableCell>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{transaction.amount}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                              {transaction.type}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setUploadStatus('idle')}>
                    Cancel
                  </Button>
                  <Button onClick={importTransactions}>
                    Import Selected
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default Upload;
