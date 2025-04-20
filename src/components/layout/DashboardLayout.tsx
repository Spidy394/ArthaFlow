import React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <div className="flex flex-1">
        {/* Sidebar - Hidden on mobile */}
        <Sidebar />
        
        {/* Main content - With left margin to account for fixed sidebar */}
        <main className={cn(
          "flex-1 overflow-auto bg-gradient-to-b from-white to-gray-50",
          "md:ml-64" // Add margin-left equivalent to sidebar width (w-64)
        )}>
          <div className="relative">
            {/* Decorative elements similar to welcome page */}
            <div className="absolute top-10 right-[10%] -z-10 h-72 w-72 rounded-full bg-gradient-to-r from-arthaflow-purple/10 to-arthaflow-teal/10 blur-3xl"></div>
            <div className="absolute bottom-10 left-[5%] -z-10 h-64 w-64 rounded-full bg-gradient-to-r from-arthaflow-teal/10 to-arthaflow-lightpurple/10 blur-3xl"></div>
            
            {/* Content container */}
            <div className="container mx-auto px-4 py-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
