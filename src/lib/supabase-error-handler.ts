
import { PostgrestError } from '@supabase/supabase-js';

export type SupabaseError = PostgrestError | Error | null;

interface ErrorMapping {
  [key: string]: string;
}

const SUPABASE_ERROR_MESSAGES: ErrorMapping = {
  'PGRST116': 'Resource not found',
  'PGRST201': 'The supplied value is invalid',
  '23505': 'A record with this information already exists',
  '23503': 'This operation would violate referential integrity',
  '42703': 'Invalid column name',
  '42P01': 'Table does not exist',
  'auth/invalid-email': 'Invalid email address',
  'auth/user-not-found': 'User not found',
  'PGRST301': 'Row level security violation',
  'default': 'An unexpected error occurred'
};

interface ErrorHandlerOptions {
  context?: string;
  defaultMessage?: string;
}

export function handleSupabaseError(
  error: SupabaseError,
  options: ErrorHandlerOptions = {}
): string {
  if (!error) return SUPABASE_ERROR_MESSAGES.default;

  const context = options.context ? `${options.context}: ` : '';
  const defaultMessage = options.defaultMessage || SUPABASE_ERROR_MESSAGES.default;

  if (error instanceof Error) {
    return `${context}${error.message}`;
  }

  // Handle PostgrestError
  if ('code' in error && error.code) {
    const errorMessage = SUPABASE_ERROR_MESSAGES[error.code] || defaultMessage;
    return `${context}${errorMessage}`;
  }

  return `${context}${defaultMessage}`;
}

// Helper function to determine if an error should be shown to the user
export function shouldShowErrorToUser(error: SupabaseError): boolean {
  if (!error) return false;

  // List of error codes that should be hidden from users
  const hiddenErrorCodes = [
    '42P01', // Table does not exist
    '42703', // Invalid column name
    'PGRST301', // Row level security violation
  ];

  if ('code' in error && error.code) {
    return !hiddenErrorCodes.includes(error.code);
  }

  return true;
}

// Helper function to determine if an error should be logged
export function shouldLogError(error: SupabaseError): boolean {
  if (!error) return false;

  // Always log non-PostgrestErrors
  if (!(error instanceof Error)) {
    return true;
  }

  // List of error codes that don't need to be logged
  const nonLoggableErrorCodes = [
    'PGRST116', // Resource not found
    '23505', // Unique violation
  ];

  if ('code' in error && error.code) {
    return !nonLoggableErrorCodes.includes(error.code);
  }

  return true;
}
