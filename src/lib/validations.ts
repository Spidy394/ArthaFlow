
import * as z from "zod";

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.string().min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a positive number",
    }),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  transaction_date: z.string().min(1, "Date is required")
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    }),
});

export const budgetSchema = z.object({
  category: z.string().min(1, "Category is required"),
  target_amount: z.string().min(1, "Target amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Target amount must be a positive number",
    }),
  start_date: z.string().min(1, "Start date is required")
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid start date format",
    }),
  end_date: z.string().min(1, "End date is required")
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid end date format",
    })
    .superRefine((date, ctx) => {
      if (ctx.data.start_date && new Date(date) <= new Date(ctx.data.start_date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date must be after start date",
        });
      }
    }),
});

export const goalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  target_amount: z.string().min(1, "Target amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Target amount must be a positive number",
    }),
  deadline: z.string().min(1, "Deadline is required")
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    })
    .superRefine((date, ctx) => {
      if (new Date(date) <= new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Deadline must be in the future",
        });
      }
    }),
});

export const challengeSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  target_amount: z.string().min(1, "Target amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Target amount must be a positive number",
    }),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required")
    .superRefine((date, ctx) => {
      if (ctx.data.start_date && new Date(date) <= new Date(ctx.data.start_date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date must be after start date",
        });
      }
    }),
  points_reward: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Points reward must be a non-negative number",
    }),
});

export const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  avatar_url: z.string().url("Invalid URL").optional().nullable(),
});


// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  data: any;
  error: string | null;
}

/**
 * Validates transaction data using the transaction schema
 * @param transaction - Transaction data to validate
 * @param userId - User ID to associate with the transaction
 * @returns Validation result with isValid flag, validated data, and any error message
 */
export async function validateTransaction(
  transaction: z.infer<typeof transactionSchema>,
  userId: string
): Promise<ValidationResult> {
  try {
    // Parse and validate the transaction data
    const validatedData = transactionSchema.parse(transaction);
    
    // Convert amount to a number
    const amount = Number(validatedData.amount);
    
    // Return the validated data with the user ID
    return {
      isValid: true,
      data: {
        ...validatedData,
        amount,
        user_id: userId,
        created_at: new Date().toISOString(),
      },
      error: null,
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        data: null,
        error: error.errors.map(e => e.message).join(', '),
      };
    }
    
    // Handle other errors
    return {
      isValid: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * Validates budget data using the budget schema
 * @param budget - Budget data to validate
 * @param userId - User ID to associate with the budget
 * @returns Validation result with isValid flag, validated data, and any error message
 */
export async function validateBudget(
  budget: z.infer<typeof budgetSchema>,
  userId: string
): Promise<ValidationResult> {
  try {
    // Parse and validate the budget data
    const validatedData = budgetSchema.parse(budget);
    
    // Convert target_amount to a number
    const target_amount = Number(validatedData.target_amount);
    
    // Return the validated data with the user ID
    return {
      isValid: true,
      data: {
        ...validatedData,
        target_amount,
        user_id: userId,
        created_at: new Date().toISOString(),
      },
      error: null,
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        data: null,
        error: error.errors.map(e => e.message).join(', '),
      };
    }
    
    // Handle other errors
    return {
      isValid: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * Validates goal data using the goal schema
 * @param goal - Goal data to validate
 * @param userId - User ID to associate with the goal
 * @returns Validation result with isValid flag, validated data, and any error message
 */
export async function validateGoal(
  goal: z.infer<typeof goalSchema>,
  userId: string
): Promise<ValidationResult> {
  try {
    // Parse and validate the goal data
    const validatedData = goalSchema.parse(goal);
    
    // Convert target_amount to a number
    const target_amount = Number(validatedData.target_amount);
    
    // Return the validated data with the user ID
    return {
      isValid: true,
      data: {
        ...validatedData,
        target_amount,
        current_amount: 0, // Initialize current amount to 0
        user_id: userId,
        created_at: new Date().toISOString(),
      },
      error: null,
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        data: null,
        error: error.errors.map(e => e.message).join(', '),
      };
    }
    
    // Handle other errors
    return {
      isValid: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * Validates challenge data using the challenge schema
 * @param challenge - Challenge data to validate
 * @param userId - User ID to associate with the challenge
 * @returns Validation result with isValid flag, validated data, and any error message
 */
export async function validateChallenge(
  challenge: z.infer<typeof challengeSchema>,
  userId: string
): Promise<ValidationResult> {
  try {
    // Parse and validate the challenge data
    const validatedData = challengeSchema.parse(challenge);
    
    // Convert target_amount and points_reward to numbers
    const target_amount = Number(validatedData.target_amount);
    const points_reward = Number(validatedData.points_reward);
    
    // Return the validated data with the user ID
    return {
      isValid: true,
      data: {
        ...validatedData,
        target_amount,
        points_reward,
        user_id: userId,
        created_at: new Date().toISOString(),
        status: 'active', // Default status for new challenges
      },
      error: null,
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        data: null,
        error: error.errors.map(e => e.message).join(', '),
      };
    }
    
    // Handle other errors
    return {
      isValid: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}
