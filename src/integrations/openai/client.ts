import { OpenAI } from 'openai';

const API_KEY_STORAGE_KEY = 'arthaflow_openai_api_key';

// Get API key from localStorage if available
const apiKey = typeof localStorage !== 'undefined' 
  ? localStorage.getItem(API_KEY_STORAGE_KEY) || ''
  : '';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey || process.env.OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true, // Enable in browser usage
});

export { openai };