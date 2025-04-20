
import { QueryClient } from '@tanstack/react-query';
import type { Tables } from '@/integrations/supabase/types';

type Transaction = Tables<'transactions'>;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1
    }
  }
});

// Function to invalidate and refetch transactions
export const invalidateTransactions = (userId: string) => {
  queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
};

// Function to prefetch transactions
export const prefetchTransactions = async (userId: string, fetchTransactions: () => Promise<Transaction[]>) => {
  await queryClient.prefetchQuery({ 
    queryKey: ['transactions', userId], 
    queryFn: fetchTransactions 
  });
};

// Update cache after transaction changes
export const updateTransactionCache = (transaction: Transaction) => {
  queryClient.setQueryData(['transactions', transaction.user_id], (oldData: Transaction[] | undefined) => {
    if (!oldData) return [transaction];
    return [...oldData, transaction];
  });
};
