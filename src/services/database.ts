import { supabase } from "@/integrations/supabase/client";
import type { SupabaseError } from "@/lib/supabase-error-handler";
import { 
  validateTransaction, 
  validateBudget,
  validateGoal,
  validateChallenge,
  type transactionSchema,
  type budgetSchema,
  type goalSchema,
  type challengeSchema
} from "@/lib/validations";
import type { z } from "zod";

interface DatabaseResult<T> {
  data: T | null;
  error: SupabaseError;
}

export class DatabaseService {
  // Transaction operations
  static async addTransaction(
    transaction: z.infer<typeof transactionSchema>,
    userId: string
  ): Promise<DatabaseResult<any>> {
    try {
      const validation = await validateTransaction(transaction, userId);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const { error } = await supabase
        .from("transactions")
        .insert(validation.data);

      if (error) throw error;

      return { data: validation.data, error: null };
    } catch (error) {
      return { data: null, error: error as SupabaseError };
    }
  }

  // Budget operations
  static async addBudget(
    budget: z.infer<typeof budgetSchema>,
    userId: string
  ): Promise<DatabaseResult<any>> {
    try {
      const validation = await validateBudget(budget, userId);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const { error } = await supabase
        .from("budgets")
        .insert(validation.data);

      if (error) throw error;

      return { data: validation.data, error: null };
    } catch (error) {
      return { data: null, error: error as SupabaseError };
    }
  }

  // Goal operations
  static async addGoal(
    goal: z.infer<typeof goalSchema>,
    userId: string
  ): Promise<DatabaseResult<any>> {
    try {
      const validation = await validateGoal(goal, userId);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const { error } = await supabase
        .from("goals")
        .insert(validation.data);

      if (error) throw error;

      return { data: validation.data, error: null };
    } catch (error) {
      return { data: null, error: error as SupabaseError };
    }
  }

  // Challenge operations
  static async addChallenge(
    challenge: z.infer<typeof challengeSchema>,
    userId: string
  ): Promise<DatabaseResult<any>> {
    try {
      const validation = await validateChallenge(challenge, userId);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const { error } = await supabase
        .from("challenges")
        .insert(validation.data);

      if (error) throw error;

      return { data: validation.data, error: null };
    } catch (error) {
      return { data: null, error: error as SupabaseError };
    }
  }

  // Common query methods
  static async fetchUserData<T>(
    table: string,
    userId: string,
    options: {
      select?: string;
      order?: { column: string; ascending?: boolean };
      limit?: number;
      filters?: Record<string, any>;
    } = {}
  ): Promise<DatabaseResult<T[]>> {
    try {
      let query = supabase
        .from(table)
        .select(options.select || '*')
        .eq('user_id', userId);

      // Apply additional filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply ordering
      if (options.order) {
        query = query.order(
          options.order.column,
          { ascending: options.order.ascending ?? false }
        );
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as SupabaseError };
    }
  }

  // Get category expenses using RPC
  static async getCategoryExpenses(
    category: string,
    userId: string,
    date: Date
  ): Promise<DatabaseResult<number>> {
    try {
      const { data, error } = await supabase
        .rpc('get_category_expenses', {
          category_name: category,
          start_date: date.toISOString().split('T')[0],
          user_id: userId
        });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as SupabaseError };
    }
  }
}

