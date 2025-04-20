import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  User, Settings, Bell, Lock, Shield, CreditCard, Mail, Phone, Fingerprint, 
  ExternalLink, Loader2, Save, Upload, AlertCircle, CheckCircle
} from "lucide-react";

// Define validation schema for profile form
const profileFormSchema = z.object({
  full_name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().optional(),
  currency: z.string().min(1, { message: "Please select a currency." }),
  avatar_url: z.string().optional()
});

// Define validation schema for password form
const passwordFormSchema = z.object({
  current_password: z.string().min(6, { message: "Current password is required." }),
  new_password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirm_password: z.string().min(6, { message: "Please confirm your password." })
}).refine(data => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"]
});

// Define types
type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

// Match with Supabase schema
interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  currency?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

type NotificationType = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([
    {
      id: "new_transaction",
      title: "New Transactions",
      description: "Get notified when a new transaction is recorded",
      enabled: true,
    },
    {
      id: "budget_alert",
      title: "Budget Alerts",
      description: "Receive alerts when you're approaching your budget limits",
      enabled: true,
    },
    {
      id: "achievement",
      title: "Achievements",
      description: "Get notified when you earn new achievements",
      enabled: true,
    },
    {
      id: "newsletter",
      title: "Monthly Newsletter",
      description: "Receive monthly financial insights and tips",
      enabled: false,
    },
  ]);

  // Initialize form with profile data
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      currency: "INR",
      avatar_url: ""
    }
  });

  // Initialize password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: ""
    }
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  // Fetch user profile data
  const fetchProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Check if profile exists in profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        // Create profile if not exists
        if (error.code === "PGRST116") {
          const newProfile: UserProfile = {
            id: user.id,
            first_name: user.user_metadata?.first_name || "",
            last_name: user.user_metadata?.last_name || "",
            full_name: user.user_metadata?.full_name || "",
            email: user.email || "",
            phone: user.user_metadata?.phone || "",
            currency: "INR",
            avatar_url: user.user_metadata?.avatar_url || "",
            created_at: new Date().toISOString(),
          };
          
          await supabase.from("profiles").insert([newProfile]);
          setProfile(newProfile);
          profileForm.reset({
            full_name: newProfile.full_name || `${newProfile.first_name || ''} ${newProfile.last_name || ''}`.trim(),
            email: newProfile.email || "",
            phone: newProfile.phone || "",
            currency: newProfile.currency || "INR",
            avatar_url: newProfile.avatar_url || "",
          });
        } else {
          throw error;
        }
      } else {
        // Format the profile data to match our UI needs
        const fullName = data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim();
        
        setProfile(data as UserProfile);
        profileForm.reset({
          full_name: fullName,
          email: data.email || user?.email || "",
          phone: data.phone || "",
          currency: data.currency || "INR",
          avatar_url: data.avatar_url || "",
        });
        
        if (data.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error fetching profile",
        description: "There was a problem loading your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Upload avatar function
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || !event.target.files[0]) return;
      
      const file = event.target.files[0];
      setAvatarFile(file);
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);
    } catch (error) {
      console.error("Error selecting file:", error);
      toast({
        title: "Error selecting file",
        description: "There was a problem selecting your file. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle profile form submission
  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Upload avatar if changed
      let finalAvatarUrl = profile?.avatar_url;
      
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('user-assets')
          .upload(filePath, avatarFile);
        
        if (uploadError) {
          throw uploadError;
        }
        
        const { data: urlData } = supabase.storage
          .from('user-assets')
          .getPublicUrl(filePath);
        
        finalAvatarUrl = urlData.publicUrl;
      }

      // Split full name into first and last name for database
      const nameParts = data.full_name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ');
      
      // Update profile in database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || null,
          currency: data.currency,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      
      if (updateError) throw updateError;
      
      // Update user metadata in auth
      await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: data.full_name,
          avatar_url: finalAvatarUrl
        }
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      fetchProfile(); // Refresh profile data
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password form submission
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    if (!user) return;
    
    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.new_password
      });
      
      if (error) throw error;
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      
      passwordForm.reset({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast({
        title: "Error updating password",
        description: error.message || "There was a problem updating your password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle notification toggle
  const handleNotificationToggle = (id: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id
          ? { ...notification, enabled: !notification.enabled }
          : notification
      )
    );
    
    toast({
      title: "Notification settings updated",
      description: "Your notification preferences have been saved.",
    });
  };

  // Generate user initials for avatar fallback
  const getUserInitials = () => {
    if (!profile) return "U";
    
    if (profile.full_name) {
      const names = profile.full_name.split(" ");
      if (names.length === 1) return names[0].charAt(0).toUpperCase();
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
    
    if (profile.first_name) {
      const firstInitial = profile.first_name.charAt(0).toUpperCase();
      const lastInitial = profile.last_name ? profile.last_name.charAt(0).toUpperCase() : '';
      return lastInitial ? firstInitial + lastInitial : firstInitial;
    }
    
    return "U";
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-arthaflow-purple" />
        </div>
      </DashboardLayout>
    );
  }

  console.log("Profile rendered", { profile, user });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">
              <User className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Settings className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
          </TabsList>
          
          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and how we can reach you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-8">
                      {/* Avatar Section */}
                      <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-28 w-28">
                          {avatarUrl ? (
                            <AvatarImage src={avatarUrl} alt="Profile" className="object-cover" />
                          ) : null}
                          <AvatarFallback className="text-2xl bg-gradient-to-br from-arthaflow-purple to-arthaflow-teal text-white">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Label htmlFor="avatar" className="cursor-pointer">
                            <div className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md text-sm font-medium">
                              <Upload className="h-4 w-4" />
                              Upload Photo
                            </div>
                          </Label>
                          <Input 
                            id="avatar" 
                            type="file" 
                            accept="image/*" 
                            className="hidden"
                            onChange={uploadAvatar}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG or GIF. Max size 2MB.
                        </p>
                      </div>

                      {/* Profile Form Fields */}
                      <div className="flex-1 space-y-4">
                        <FormField
                          control={profileForm.control}
                          name="full_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="your.email@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="+91 12345 67890" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="currency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Currency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                                    <SelectItem value="EUR">Euro (€)</SelectItem>
                                    <SelectItem value="GBP">British Pound (£)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  View details about your ArthaFlow account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Account Created</h3>
                    <p>{new Date(profile?.created_at || "").toLocaleDateString("en-US", { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Account ID</h3>
                    <p className="font-mono text-xs">{user?.id}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Connected Services</h3>
                  <div className="rounded-md border p-3 flex justify-between items-center">
                    <div className="flex gap-2 items-center">
                      <div className="rounded-full bg-green-100 p-1">
                        <Mail className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Email Authentication</p>
                        <p className="text-xs text-muted-foreground">{profile?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Connected</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Control how and when we notify you about activity in your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="flex justify-between items-center">
                      <div className="space-y-1">
                        <h4 className="font-medium">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {notification.description}
                        </p>
                      </div>
                      <Switch
                        checked={notification.enabled}
                        onCheckedChange={() => handleNotificationToggle(notification.id)}
                      />
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Notification Channels</h3>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Label className="flex flex-col items-start space-y-2 rounded-md border p-4 cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="form-checkbox rounded text-primary" defaultChecked />
                        <span>Email Notifications</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Get important updates via email
                      </span>
                    </Label>
                    
                    <Label className="flex flex-col items-start space-y-2 rounded-md border p-4 cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="form-checkbox rounded text-primary" />
                        <span>Push Notifications</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Get notifications on your device
                      </span>
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="current_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="new_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirm_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isUpdatingPassword}>
                        {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <Fingerprint className="h-4 w-4" />
                        Two-Factor Authentication
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline">Setup</Button>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Login Sessions</h4>
                    <div className="rounded-md border divide-y">
                      <div className="p-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Current Session</p>
                          <p className="text-xs text-muted-foreground">Windows • Chrome • Delhi, India</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active Now</Badge>
                      </div>
                      <div className="p-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Previous Session</p>
                          <p className="text-xs text-muted-foreground">Android • Mobile App • 2 days ago</p>
                        </div>
                        <Button size="sm" variant="ghost">Revoke</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button variant="destructive">Sign Out of All Devices</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>App Preferences</CardTitle>
                <CardDescription>
                  Customize how ArthaFlow works for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Dark Mode</h4>
                      <p className="text-sm text-muted-foreground">
                        Toggle between light and dark themes
                      </p>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Start Page</h4>
                      <p className="text-sm text-muted-foreground">
                        Choose which page to show when you first open the app
                      </p>
                    </div>
                    <Select defaultValue="dashboard">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select start page" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dashboard">Dashboard</SelectItem>
                        <SelectItem value="transactions">Transactions</SelectItem>
                        <SelectItem value="budgets">Budgets</SelectItem>
                        <SelectItem value="trends">Trends</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Date & Number Format</h3>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Date Format</Label>
                      <Select defaultValue="dd/mm/yyyy">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select date format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                          <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                          <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Number Format</Label>
                      <Select defaultValue="en-IN">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select number format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en-IN">Indian (1,00,000.00)</SelectItem>
                          <SelectItem value="en-US">US (100,000.00)</SelectItem>
                          <SelectItem value="en-GB">International (100 000,00)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Data Privacy</h3>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Usage Analytics</h4>
                      <p className="text-sm text-muted-foreground">
                        Allow us to collect anonymous usage data to improve ArthaFlow
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Privacy First</AlertTitle>
                    <AlertDescription>
                      Your financial data is never shared with third parties without your explicit permission.
                      <Button variant="link" className="p-0 h-auto text-sm font-normal" asChild>
                        <a href="#" className="inline-flex items-center gap-1">
                          Privacy Policy <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </AlertDescription>
                  </Alert>
                </div>
                
                <div className="flex justify-end">
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Profile;