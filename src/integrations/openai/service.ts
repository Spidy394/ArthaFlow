
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Transaction = Tables<'transactions'>;
type Budget = Tables<'budgets'>;

export class OpenAIService {
  static async generateInsights(userId: string) {
    try {
      // Fetch user's transactions and budgets
      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);

      if (transactionError) throw transactionError;

      const { data: budgets, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId);

      if (budgetError) throw budgetError;

      // Format data for prompt
      const formattedTransactions = transactions?.map(formatTransactionForPrompt);
      const formattedBudgets = budgets?.map(formatBudgetForPrompt);

      // Construct prompt
      const prompt = this.constructPrompt(formattedTransactions, formattedBudgets);

      // Call OpenAI API
      const insights = await this.callOpenAI(prompt);

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return 'Failed to generate insights. Please try again later.';
    }
  }

  private static constructPrompt(transactions: any[], budgets: any[]) {
    return `
      Analyze the following financial data and provide personalized insights and recommendations.
      Transactions: ${JSON.stringify(transactions)}
      Budgets: ${JSON.stringify(budgets)}

      Focus on identifying spending patterns, potential savings, and budget optimization.
      Provide concise and actionable advice.
    `;
  }

  private static async callOpenAI(prompt: string) {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      const apiUrl = 'https://api.openai.com/v1/chat/completions';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('OpenAI API Error:', data);
        throw new Error(data.error?.message || 'Failed to generate insights');
      }

      return data.choices[0]?.message?.content || 'No insights generated.';
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return 'Failed to generate insights. Please try again later.';
    }
  }
}

// Export the static method for direct use
export const generateFinancialInsights = OpenAIService.generateInsights;

const formatTransactionForPrompt = (transaction: Transaction) => {
  return {
    amount: transaction.amount,
    category: transaction.category,
    date: transaction.transaction_date,
    description: transaction.description,
  };
};

const formatBudgetForPrompt = (budget: Budget) => {
  return {
    category: budget.category,
    targetAmount: budget.target_amount,
    startDate: budget.start_date,
    endDate: budget.end_date,
  };
};
