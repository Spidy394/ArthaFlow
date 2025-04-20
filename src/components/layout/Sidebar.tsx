import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  BarChart2, 
  LineChart, 
  PieChart, 
  Upload, 
  Settings, 
  Target, 
  Users,
  Trophy,
  Award,
  Brain
} from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  title: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const NavItem = ({ href, icon: Icon, title, isActive, onClick }: NavItemProps) => {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-x-2 text-gray-900 hover:bg-gradient-to-r hover:from-arthaflow-purple/5 hover:to-arthaflow-teal/5 rounded-lg px-3 py-2 transition-all duration-200",
        isActive && "bg-gradient-to-r from-arthaflow-purple/10 to-arthaflow-teal/10 text-arthaflow-purple border-l-2 border-arthaflow-teal"
      )}
      onClick={onClick}
    >
      <Icon className={cn("h-5 w-5", isActive && "text-arthaflow-teal")} />
      <span>{title}</span>
    </Link>
  );
};

// Reusable navigation content component
export const SidebarNavContent: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <>
      <div className="space-y-1 px-3">
        <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider px-3 mb-2">
          Main
        </h2>
        <NavItem
          href="/dashboard"
          icon={LayoutDashboard}
          title="Dashboard"
          isActive={currentPath === "/dashboard"}
          onClick={onClick}
        />
        <NavItem
          href="/transactions"
          icon={BarChart2}
          title="Transactions"
          isActive={currentPath === "/transactions"}
          onClick={onClick}
        />
        <NavItem
          href="/budgets"
          icon={PieChart}
          title="Budgets"
          isActive={currentPath === "/budgets"}
          onClick={onClick}
        />
        <NavItem
          href="/trends"
          icon={LineChart}
          title="Trends"
          isActive={currentPath === "/trends"}
          onClick={onClick}
        />
        <NavItem
          href="/goals"
          icon={Target}
          title="Goals"
          isActive={currentPath === "/goals"}
          onClick={onClick}
        />
        <NavItem
          href="/upload"
          icon={Upload}
          title="Upload Data"
          isActive={currentPath === "/upload"}
          onClick={onClick}
        />
      </div>
      
      {/* Gradient separator */}
      <div className="h-px bg-gradient-to-r from-arthaflow-purple/20 via-arthaflow-teal/20 to-transparent mx-4 my-4"></div>
      
      <div className="space-y-1 px-3">
        <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider px-3 mb-2">
          Gamification
        </h2>
        <NavItem
          href="/challenges"
          icon={Trophy}
          title="Challenges"
          isActive={currentPath === "/challenges"}
          onClick={onClick}
        />
        <NavItem
          href="/achievements"
          icon={Award}
          title="Achievements"
          isActive={currentPath === "/achievements"}
          onClick={onClick}
        />
        <NavItem
          href="/insights"
          icon={Brain}
          title="AI Insights"
          isActive={currentPath === "/insights"}
          onClick={onClick}
        />
      </div>

      <div className="mt-auto space-y-1 px-3">
        {/* Gradient separator */}
        <div className="h-px bg-gradient-to-r from-arthaflow-purple/20 via-arthaflow-teal/20 to-transparent mx-4 mb-4"></div>
        
        <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider px-3 mb-2">
          Settings
        </h2>
        <NavItem
          href="/profile"
          icon={Users}
          title="Profile"
          isActive={currentPath === "/profile"}
          onClick={onClick}
        />
        <NavItem
          href="/settings"
          icon={Settings}
          title="Settings"
          isActive={currentPath === "/settings"}
          onClick={onClick}
        />
      </div>
    </>
  );
};

export function Sidebar() {
  return (
    <aside className="hidden md:block fixed left-0 top-0 h-screen w-64 bg-white/80 backdrop-blur-sm border-r border-gray-100/60 shadow-sm z-40">
      {/* Fixed header */}
      <div className="px-6 py-3">
        <h1 className="text-2xl font-bold flex items-center">
          <span className="text-arthaflow-teal">Artha</span>
          <span className="text-arthaflow-lightpurple">Flow</span>
        </h1>
        <p className="text-sm text-muted-foreground">Smart Financial Dashboard</p>
      </div>
      
      {/* Gradient separator for header */}
      <div className="h-px bg-gradient-to-r from-arthaflow-purple/20 via-arthaflow-teal/20 to-transparent mx-4 mb-2"></div>
      
      {/* Scrollable content area */}
      <div className="overflow-y-auto h-[calc(100vh-80px)] py-2 flex flex-col">
        <SidebarNavContent />
      </div>
    </aside>
  );
}
