import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Loading from "./pages/Loading";
import Welcome from "./pages/Welcome";
import Challenges from "./pages/Challenges";
import Achievements from "./pages/Achievements";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";

/**
 * Protected route component that redirects to auth page if user is not logged in
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  // Show loading indicator while auth state is being determined
  if (loading) {
    return <Loading />;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

/**
 * Root route component that redirects based on authentication status
 */
const RootRedirect = () => {
  const { user, loading } = useAuth();
  
  // Show loading indicator while auth state is being determined
  if (loading) {
    return <Loading />;
  }
  
  // After auth state is determined, redirect appropriately
  return (
    <Navigate to={user ? "/dashboard" : "/welcome"} replace />
  );
};

/**
 * Main App component that sets up routing
 */
const App = () => {
  return (
    <TooltipProvider>
      <Toaster />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/features" element={<Welcome />} />
        <Route path="/about" element={<Welcome />} />
        <Route path="/auth" element={<Auth />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/transactions" 
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/budgets" 
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/trends" 
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/goals" 
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/upload" 
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } 
        />
        {/* Gamification features */}
        <Route 
          path="/challenges" 
          element={
            <ProtectedRoute>
              <Challenges />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/achievements" 
          element={
            <ProtectedRoute>
              <Achievements />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/insights" 
          element={
            <ProtectedRoute>
              <Insights />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  );
};

export default App;
