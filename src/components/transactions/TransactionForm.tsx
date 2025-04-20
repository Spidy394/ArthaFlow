import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IndianRupee } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { DatabaseService } from "@/services/database";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { transactionSchema } from "@/lib/validations";

interface TransactionFormProps {
  closeDialog?: () => void;
}

export default function TransactionForm({ closeDialog }: TransactionFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      amount: "",
      category: "",
      description: "",
      transaction_date: new Date().toISOString().split("T")[0],
    },
  });

  const addTransaction = useMutation({
    mutationFn: async (values: z.infer<typeof transactionSchema>) => {
      if (!user?.id) throw new Error("User not authenticated");

      const result = await DatabaseService.addTransaction(values, user.id);
      if (result.error) throw result.error;
      return result.data;
    },
    onError: (error) => {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please login to add transactions",
          variant: "destructive",
        });
        navigate("/auth");
      } else {
        handleError(error, "Failed to add transaction");
      }
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Transaction added successfully",
        description: `${variables.type === "income" ? "Income" : "Expense"} of ₹${
          variables.amount
        } has been recorded.`,
      });
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['spending-trends'] });
      
      form.reset();
      
      // Close dialog if provided (when used in a dialog)
      if (closeDialog) {
        closeDialog();
      }
    },
  });

  function onSubmit(values: z.infer<typeof transactionSchema>) {
    addTransaction.mutate(values);
  }
  
  // Show loading overlay when submitting
  if (addTransaction.isPending) {
    return (
      <div className="rounded-lg border bg-card p-4 relative">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <LoadingSpinner message="Adding transaction..." />
        </div>
        <div className="opacity-50">
          <h3 className="font-semibold mb-4">Add New Transaction</h3>
          {/* Form would render here but is blurred during submission */}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold mb-4">Add New Transaction</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {addTransaction.isError && (
            <div className="p-2 mb-2 text-sm text-red-500 bg-red-50 rounded-md">
              Something went wrong. Please try again.
            </div>
          )}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (₹)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="number" className="pl-10" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Housing">Housing</SelectItem>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Transportation">Transportation</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Salary">Salary</SelectItem>
                    <SelectItem value="Investment">Investment</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transaction_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            Add Transaction
          </Button>
        </form>
      </Form>
    </div>
  );
}
