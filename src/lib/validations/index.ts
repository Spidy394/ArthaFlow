import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";

// Transaction validation schema
export const transactionSchema = z.object({
  type: z.enum(["income", "expense"], {
    required_error: "Transaction type is required"
  }),
  amount: z.string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a positive number",
    }),
  category: z.string()
    .min(1, "Category is required")
    .max(50, "Category name too long"),
  description: z.string()
    .max(255, "Description too long")
    .optional()
    .nullable(),
  transaction_date: z.string()
    .min(1, "Date is required")
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    })
    .refine((date) => new Date(date) <= new Date(), {
      message: "Transaction date cannot be in the future",
    }),
});

// Budget validation schema
export const budgetSchema = z.object({
  category: z.string()
    .min(1, "Category is required")
    .max(50, "Category name too long"),
  target_amount: z.string()
    .min(1, "Target amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Target amount must be a positive number",
    }),
  start_date: z.string()
    .min(1, "Start date is required")
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid start date format",
    }),
  end_date: z.string()
    .min(1, "End date is required")
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid end date format",
    })
    .refine((date, ctx) => {
      const start = new Date(ctx.parent.start_date);
      const end = new Date(date);
      return end > start;
    }, {
      message: "End date must be after start date",
    }),
});

// Goal validation schema
export const goalSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(50, "Title is too long"),
  target_amount: z.string()
    .min(1, "Target amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Target amount must be a positive number",
    }),
  deadline: z.string()
    .min(1, "Deadline is required")
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    })
    .refine((date) => new Date(date) > new Date(), {
      message: "Deadline must be in the future",
    }),
});

// Challenge validation schema
export const challengeSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title is too long"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(255, "Description is too long"),
  category: z.string()
    .min(1, "Category is required"),
  target_amount: z.string()
    .min(1, "Target amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Target amount must be a positive number",
    }),
  start_date: z.string()
    .min(1, "Start date is required"),
  end_date: z.string()
    .min(1, "End date is required")
    .refine((date, ctx) => {
      const start = new Date(ctx.parent.start_date);
      const end = new Date(date);
      return end > start;
    }, {
      message: "End date must be after start date",
    }),
  points_reward: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Points reward must be a non-negative number",
    }),
});

// Database validation functions
export const validateTransaction = async (
  transaction: z.infer<typeof transactionSchema>,
  userId: string
) => {
  try {
    // Parse and validate the transaction data
    const validData = transactionSchema.parse(transaction);
    
    // Additional database-specific validations
    const amount = parseFloat(validData.amount);
    if (amount > 1000000) {
      throw new Error("Transaction amount exceeds maximum limit");
    }
    
    // For expenses, check if user has sufficient budget
    if (validData.type === "expense") {
      const { data: budget } = await supabase
        .from("budgets")
        .select("target_amount")
        .eq("user_id", userId)
        .eq("category", validData.category)
        .single();
      
      if (budget) {
        const { data: spent } = await supabase
          .rpc("get_category_expenses", {
            category: validData.category,
            start_date: new Date().toISOString().split("T")[0],
            user_id: userId
          });
        
        if (spent && (spent + amount) > budget.target_amount * 1.5) {
          throw new Error("This expense would exceed your budget by more than 50%");
        }
      }
    }
    
    return {
      isValid: true,
      data: {
        ...validData,
        amount,
        user_id: userId
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0].message
      };
    }
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Validation failed"
    };
  }
};

export const validateBudget = async (
  budget: z.infer<typeof budgetSchema>,
  userId: string
) => {
  try {
    // Parse and validate the budget data
    const validData = budgetSchema.parse(budget);
    
    // Additional database-specific validations
    const targetAmount = parseFloat(validData.target_amount);
    if (targetAmount > 1000000) {
      throw new Error("Budget amount exceeds maximum limit");
    }
    
    // Check for overlapping budgets in the same category
    const { data: existingBudget } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userId)
      .eq("category", validData.category)
      .overlaps("start_date", validData.start_date)
      .overlaps("end_date", validData.end_date)
      .single();
    
    if (existingBudget) {
      throw new Error("A budget for this category already exists for the selected date range");
    }
    
    return {
      isValid: true,
      data: {
        ...validData,
        target_amount: targetAmount,
        user_id: userId
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0].message
      };
    }
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Validation failed"
    };
  }
};

// Goal validation function
export const validateGoal = async (
  goal: z.infer<typeof goalSchema>,
  userId: string
) => {
  try {
    const validData = goalSchema.parse(goal);
    
    const targetAmount = parseFloat(validData.target_amount);
    if (targetAmount > 10000000) {
      throw new Error("Goal amount exceeds maximum limit");
    }
    
    // Check for existing active goals
    const { count } = await supabase
      .from("goals")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", userId)
      .gt("deadline", new Date().toISOString())
      .lt("current_amount", supabase.raw("target_amount"));
    
    if (count && count >= 5) {
      throw new Error("Maximum number of active goals reached (5)");
    }
    
    return {
      isValid: true,
      data: {
        ...validData,
        target_amount: targetAmount,
        current_amount: 0,
        user_id: userId
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0].message
      };
    }
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Validation failed"
    };
  }
};

// Challenge validation function
export const validateChallenge = async (
  challenge: z.infer<typeof challengeSchema>,
  userId: string
) => {
  try {
    const validData = challengeSchema.parse(challenge);
    
    const targetAmount = parseFloat(validData.target_amount);
    const pointsReward = parseInt(validData.points_reward);
    
    // Check for excessive values
    if (targetAmount > 1000000) {
      throw new Error("Challenge target amount exceeds maximum limit");
    }
    if (pointsReward > 1000) {
      throw new Error("Challenge points reward exceeds maximum limit");
    }
    
    // Check challenge duration (minimum 1 day, maximum 90 days)
    const startDate = new Date(validData.start_date);
    const endDate = new Date(validData.end_date);
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (durationDays < 1) {
      throw new Error("Challenge duration must be at least 1 day");
    }
    if (durationDays > 90) {
      throw new Error("Challenge duration cannot exceed 90 days");
    }
    
    // Check for overlapping challenges in the same category
    const { data: existingChallenge } = await supabase
      .from("challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("category", validData.category)
      .eq("status", 'active')
      .overlaps("start_date", validData.start_date)
      .overlaps("end_date", validData.end_date)
      .single();
    
    if (existingChallenge) {
      throw new Error("An active challenge for this category already exists in the selected date range");
    }
    
    return {
      isValid: true,
      data: {
        ...validData,
        target_amount: targetAmount,
        current_amount: 0,
        points_reward: pointsReward,
        status: 'active' as const,
        user_id: userId
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0].message
      };
    }
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Validation failed"
    };
  }
};
