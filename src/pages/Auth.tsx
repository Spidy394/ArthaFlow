import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertCircle, Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
// Common email validation with domain check
const emailSchema = z.string()
  .email("Invalid email address")
  .refine(
    (email) => {
      const domain = email.split('@')[1];
      // List of disposable email domains could be expanded
      const disposableDomains = ['tempmail.com', 'fakeemail.com', 'throwaway.com'];
      return !disposableDomains.includes(domain);
    },
    { message: "Email domain not allowed. Please use a valid email address." }
  );

// Strong password validation
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .refine(
    (password) => /[A-Z]/.test(password),
    { message: "Password must contain at least one uppercase letter" }
  )
  .refine(
    (password) => /[a-z]/.test(password),
    { message: "Password must contain at least one lowercase letter" }
  )
  .refine(
    (password) => /[0-9]/.test(password),
    { message: "Password must contain at least one number" }
  )
  .refine(
    (password) => /[^A-Za-z0-9]/.test(password),
    { message: "Password must contain at least one special character" }
  );

// Login form schema
const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

// Registration form schema
const registerFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

// Password reset form schema
const resetPasswordFormSchema = z.object({
  email: emailSchema,
});
// Custom hook for login rate limiting
const useLoginRateLimit = () => {
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitEndTime, setRateLimitEndTime] = useState<Date | null>(null);
  
  const addLoginAttempt = () => {
    if (isRateLimited) return;
    
    const newCount = loginAttempts + 1;
    setLoginAttempts(newCount);
    
    if (newCount >= 5) {
      // Rate limit for 5 minutes after 5 failed attempts
      const endTime = new Date();
      endTime.setMinutes(endTime.getMinutes() + 5);
      setRateLimitEndTime(endTime);
      setIsRateLimited(true);
      
      // Reset rate limit after 5 minutes
      setTimeout(() => {
        setLoginAttempts(0);
        setIsRateLimited(false);
        setRateLimitEndTime(null);
      }, 5 * 60 * 1000);
    }
  };
  
  return { loginAttempts, isRateLimited, rateLimitEndTime, addLoginAttempt };
};

// Session timeout handler
const useSessionTimeout = () => {
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimeoutDuration = 30 * 60 * 1000; // 30 minutes
  
  const resetSessionTimeout = () => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    sessionTimeoutRef.current = setTimeout(() => {
      // Sign out user on timeout
      supabase.auth.signOut();
      window.location.href = '/auth'; // Redirect to login
    }, sessionTimeoutDuration);
  };
  
  useEffect(() => {
    // Set up event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const resetOnActivity = () => resetSessionTimeout();
    
    // Initial timeout
    resetSessionTimeout();
    
    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, resetOnActivity);
    });
    
    // Cleanup
    return () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
      
      events.forEach(event => {
        window.removeEventListener(event, resetOnActivity);
      });
    };
  }, []);
  
  return { resetSessionTimeout };
};

export default function Auth() {
  // Authentication mode state
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loginAttempts, isRateLimited, rateLimitEndTime, addLoginAttempt } = useLoginRateLimit();
  const { resetSessionTimeout } = useSessionTimeout();
  
  // Refs for keyboard navigation and accessibility
  const formRef = useRef<HTMLFormElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  // Login form
  const loginForm = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  // Reset password form
  const resetPasswordForm = useForm<z.infer<typeof resetPasswordFormSchema>>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      email: "",
    },
  });

  // Focus the email input on mount and mode change
  useEffect(() => {
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 100);
    
    // Reset forms when changing modes
    loginForm.reset();
    registerForm.reset();
    resetPasswordForm.reset();
    setPasswordResetSent(false);
  }, [mode]);
  // Handle login submission
  async function handleLogin(values: z.infer<typeof loginFormSchema>) {
    if (isRateLimited) {
      const timeRemaining = rateLimitEndTime ? 
        Math.ceil((rateLimitEndTime.getTime() - Date.now()) / 60000) : 5;
      
      toast({
        title: "Too many attempts",
        description: `Please try again in ${timeRemaining} minutes`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        addLoginAttempt();
        throw error;
      }

      // Handle "Remember Me" option
      if (values.rememberMe) {
        // Set a longer session expiration in local storage
        localStorage.setItem('rememberSession', 'true');
      } else {
        localStorage.removeItem('rememberSession');
      }

      // Reset session timeout on successful login
      resetSessionTimeout();

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      let errorMessage = error.message;
      
      // More specific error messages
      if (error.message.includes("credentials")) {
        errorMessage = "Invalid email or password";
      } else if (error.message.includes("network")) {
        errorMessage = "Network error. Please check your connection.";
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Announce error for screen readers
      const errorEl = document.createElement('div');
      errorEl.setAttribute('role', 'alert');
      errorEl.setAttribute('aria-live', 'assertive');
      errorEl.textContent = `Error: ${errorMessage}`;
      document.body.appendChild(errorEl);
      setTimeout(() => document.body.removeChild(errorEl), 1000);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle registration submission
  async function handleRegister(values: z.infer<typeof registerFormSchema>) {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?verification=success`,
        }
      });

      if (error) throw error;

      toast({
        title: "Sign up successful",
        description: "Please check your email to verify your account.",
      });
      
      // Switch to login mode after successful registration
      setTimeout(() => setMode('login'), 2000);
    } catch (error: any) {
      let errorMessage = error.message;
      
      // More specific error messages
      if (error.message.includes("email")) {
        errorMessage = "This email is already registered or invalid";
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Handle password reset submission
  async function handlePasswordReset(values: z.infer<typeof resetPasswordFormSchema>) {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth?mode=reset-confirmation`,
      });

      if (error) throw error;

      setPasswordResetSent(true);
      toast({
        title: "Password reset email sent",
        description: "Please check your email for the reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  // Calculate remaining time for rate limiting
  const getRateLimitTimeRemaining = (): number => {
    if (!rateLimitEndTime) return 5;
    return Math.max(1, Math.ceil((rateLimitEndTime.getTime() - Date.now()) / 60000));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8f6fe] to-[#f0f7fb] flex flex-col">
      <Navbar showSignIn={false} />
      
      <div className="flex flex-grow items-center justify-center p-4">
        <Card className="w-full max-w-md border border-[#e2e8f0] shadow-[0_10px_30px_-15px_rgba(110,89,165,0.2)]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-arthaflow-darkpurple via-arthaflow-purple to-arthaflow-teal text-transparent bg-clip-text">
              ArthaFlow
            </CardTitle>
            <CardDescription>
              Manage your finances with confidence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(value) => setMode(value as 'login' | 'register' | 'reset')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
                <TabsTrigger value="reset">Reset</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                {isRateLimited && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Rate Limited</AlertTitle>
                    <AlertDescription>
                      Too many login attempts. Please try again in {getRateLimitTimeRemaining()} minutes.
                    </AlertDescription>
                  </Alert>
                )}

                <Form {...loginForm}>
                  <form 
                    ref={formRef}
                    onSubmit={loginForm.handleSubmit(handleLogin)} 
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              ref={emailInputRef}
                              type="email" 
                              placeholder="Enter your email" 
                              autoComplete="email"
                              aria-required="true"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <PasswordInput
                              placeholder="Enter your password"
                              autoComplete="current-password"
                              aria-required="true"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              aria-label="Remember this device"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Remember me</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-arthaflow-darkpurple via-arthaflow-purple to-arthaflow-teal hover:from-arthaflow-purple hover:to-[#38bdf8] transition-all duration-300 shadow-sm hover:shadow-md"
                      disabled={isLoading || isRateLimited}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </span>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form 
                    onSubmit={registerForm.handleSubmit(handleRegister)}
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Enter your email" 
                              autoComplete="email"
                              aria-required="true"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <PasswordInput
                              placeholder="Create a strong password"
                              autoComplete="new-password"
                              aria-required="true"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <PasswordInput
                              placeholder="Confirm your password"
                              autoComplete="new-password"
                              aria-required="true"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              aria-required="true"
                              aria-label="Accept terms and conditions"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I accept the terms and conditions
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-arthaflow-darkpurple via-arthaflow-purple to-arthaflow-teal hover:from-arthaflow-purple hover:to-[#38bdf8] transition-all duration-300 shadow-sm hover:shadow-md"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </span>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Reset Password Tab */}
              <TabsContent value="reset">
                {passwordResetSent ? (
                  <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Check your email</AlertTitle>
                    <AlertDescription>
                      If an account exists with this email, you will receive password reset instructions.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Form {...resetPasswordForm}>
                    <form 
                      onSubmit={resetPasswordForm.handleSubmit(handlePasswordReset)}
                      className="space-y-4"
                    >
                      <FormField
                        control={resetPasswordForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="Enter your email" 
                                autoComplete="email"
                                aria-required="true"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-arthaflow-darkpurple via-arthaflow-purple to-arthaflow-teal hover:from-arthaflow-purple hover:to-[#38bdf8] transition-all duration-300 shadow-sm hover:shadow-md"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending reset email...
                          </span>
                        ) : (
                          "Send Reset Link"
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              {mode === 'login' && "Don't have an account? "}
              {mode === 'register' && "Already have an account? "}
              {mode === 'reset' && "Remember your password? "}
              <Button
                variant="link"
                className="p-0 h-auto font-semibold text-arthaflow-purple hover:text-arthaflow-darkpurple"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              >
                {mode === 'login' && "Sign up"}
                {mode === 'register' && "Sign in"}
                {mode === 'reset' && "Sign in"}
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
