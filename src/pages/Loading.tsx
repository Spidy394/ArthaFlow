import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Loading = () => {
  const navigate = useNavigate();
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            navigate("/welcome");
          }, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [navigate]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-5xl font-bold mb-8 flex items-center">
        <span className="text-secondary">Artha</span>
        <span className="text-primary">Flow</span>
      </div>
      
      <div className="w-64 h-2 bg-muted rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300 rounded-full"
          style={{ width: `${loadingProgress}%` }}
        />
      </div>
      
      <p className="text-muted-foreground">Loading... {loadingProgress}%</p>
    </div>
  );
};

export default Loading;