import { supabase } from "@/integrations/supabase/client";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${window.location.origin}/auth/google/callback`;

// Define global gapi type
declare global {
  interface Window {
    gapi: any;
  }
}

export class GoogleCalendarService {
  // Initialize Google Calendar API
  static async initialize() {
    await this.loadGoogleAPI();
    return new Promise((resolve) => {
      window.gapi.load('client:auth2', () => {
        window.gapi.client.init({
          clientId: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/calendar',
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
        }).then(resolve);
      });
    });
  }

  // Load Google API script
  private static loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window.gapi !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  // Authorize with Google Calendar
  static async authorize() {
    try {
      await this.initialize();
      
      const auth = window.gapi.auth2.getAuthInstance();
      const user = await auth.signIn();
      const authResponse = user.getAuthResponse();
      
      // Store tokens in Supabase
      const { error } = await supabase.from('oauth_tokens').upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        provider: 'google',
        access_token: authResponse.access_token,
        refresh_token: authResponse.refresh_token,
        expires_at: new Date(authResponse.expires_at * 1000).toISOString(),
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error authorizing with Google Calendar:', error);
      return false;
    }
  }

  // Refresh Google Calendar token
  static async refreshToken(userId: string, refreshToken: string): Promise<boolean> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);

      // Update tokens in Supabase
      const { error } = await supabase.from('oauth_tokens').upsert({
        user_id: userId,
        provider: 'google',
        access_token: data.access_token,
        expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error refreshing Google Calendar token:', error);
      return false;
    }
  }

  // Add reminder to Google Calendar
  static async addReminder(event: {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
  }): Promise<boolean> {
    try {
      await this.initialize();
      
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: {
          summary: event.title,
          description: event.description,
          start: { dateTime: event.startTime.toISOString() },
          end: { dateTime: event.endTime.toISOString() },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 30 },
              { method: 'email', minutes: 60 }
            ]
          }
        }
      });

      return response.status === 200;
    } catch (error) {
      console.error('Error adding reminder to Google Calendar:', error);
      return false;
    }
  }
}
