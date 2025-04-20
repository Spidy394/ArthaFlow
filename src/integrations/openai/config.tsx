import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Check, Key } from 'lucide-react';
import { openai } from './client';

const API_KEY_STORAGE_KEY = 'arthaflow_openai_api_key';

export function OpenAIConfig() {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsConfigured(true);
      
      // Update the OpenAI client with the saved API key
      if (openai) {
        // @ts-ignore - Dynamically setting API key
        openai.apiKey = savedApiKey;
      }
    }
  }, []);

  const handleSaveApiKey = () => {
    if (apiKey) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
      
      // Update the OpenAI client with the new API key
      if (openai) {
        // @ts-ignore - Dynamically setting API key
        openai.apiKey = apiKey;
      }
      
      setIsSaved(true);
      setIsConfigured(true);
      
      // Reset the saved state after a delay
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey('');
    setIsConfigured(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Key className="h-5 w-5 mr-2" />
          OpenAI API Configuration
        </CardTitle>
        <CardDescription>
          Configure your OpenAI API key for AI-powered financial insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="apiKey">OpenAI API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Your API key is stored securely in your browser's local storage and is never sent to our servers.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {isConfigured && (
          <Button variant="outline" onClick={handleClearApiKey}>
            Clear API Key
          </Button>
        )}
        <Button 
          onClick={handleSaveApiKey}
          disabled={!apiKey || apiKey.length < 10}
          className="ml-auto"
        >
          {isSaved ? (
            <>
              <Check className="h-4 w-4 mr-1" /> Saved
            </>
          ) : (
            'Save API Key'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}