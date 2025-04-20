import React, { useState } from "react";
import { Menu, Bell, Upload, User, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { SidebarNavContent } from "./Sidebar";

export function Topbar() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  const closeMobileSidebar = () => {
    setShowMobileSidebar(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between bg-white/80 backdrop-blur-sm border-b border-gray-100/60 px-4 md:px-6 shadow-sm">
        <div className="flex items-center md:hidden">
          <Button variant="ghost" size="icon" className="mr-2" onClick={toggleSidebar}>
            {showMobileSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          <h1 className="text-xl font-bold">
            <span className="text-arthaflow-teal">Artha</span>
            <span className="text-arthaflow-lightpurple">Flow</span>
          </h1>
        </div>
        <div className="hidden md:block">
          <h2 className="text-xl font-bold">
            <span className="bg-gradient-to-r from-arthaflow-purple to-arthaflow-teal bg-clip-text text-transparent">
              Financial Dashboard
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden md:flex gap-2 border-arthaflow-teal/20 text-arthaflow-teal hover:bg-arthaflow-teal/5"
            onClick={() => navigate("/upload")}
          >
            <Upload className="h-4 w-4" />
            Upload CSV
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500 hover:text-arthaflow-purple transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full overflow-hidden hover:bg-arthaflow-purple/5"
              >
                <User className="h-5 w-5 text-gray-500" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user?.email || 'My Account'}</span>
                  <span className="text-xs text-muted-foreground">Manage your account</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-500 cursor-pointer">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden" 
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Mobile sidebar with the reusable SidebarNavContent */}
      <div className={cn(
        "md:hidden fixed top-0 left-0 h-screen w-64 bg-white/90 backdrop-blur-sm border-r border-gray-100/60 shadow-lg z-45 transform transition-transform duration-300",
        showMobileSidebar ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="overflow-y-auto h-full">
          <div className="px-6 py-3">
            <h1 className="text-2xl font-bold flex items-center">
              <span className="text-arthaflow-teal">Artha</span>
              <span className="text-arthaflow-lightpurple">Flow</span>
            </h1>
            <p className="text-sm text-muted-foreground">Smart Financial Dashboard</p>
          </div>
          
          {/* Gradient separator for header */}
          <div className="h-px bg-gradient-to-r from-arthaflow-purple/20 via-arthaflow-teal/20 to-transparent mx-4 mb-2"></div>
          
          {/* Use the reusable SidebarNavContent component with a click handler to close the sidebar */}
          <div className="py-2 flex flex-col">
            <SidebarNavContent onClick={closeMobileSidebar} />
          </div>
        </div>
      </div>
    </>
  );
}
