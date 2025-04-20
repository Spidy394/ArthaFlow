
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  showSignIn?: boolean;
  transparent?: boolean;
}
const Navbar = ({ showSignIn = true, transparent = false }: NavbarProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Track scroll position - kept for glass effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Determine if we should show the glass effect
  const isScrolled = scrollPosition > 20;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={`w-full fixed top-0 left-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? "backdrop-blur-md bg-white/70 shadow-sm border-b border-white/20" 
        : (transparent ? "bg-transparent" : "bg-white/20 backdrop-blur-sm")
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate("/welcome")}>
            <div className="text-2xl md:text-3xl font-extrabold flex items-center">
              <span className="bg-gradient-to-r from-arthaflow-darkpurple via-arthaflow-purple to-arthaflow-teal text-transparent bg-clip-text drop-shadow-sm">Artha</span>
              <span className="bg-gradient-to-r from-arthaflow-teal to-arthaflow-lightpurple text-transparent bg-clip-text drop-shadow-sm">Flow</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/features" 
              className="text-arthaflow-darkpurple hover:text-arthaflow-teal transition-colors duration-300 font-medium"
            >
              Features
            </Link>
            <Link 
              to="/about" 
              className="text-arthaflow-darkpurple hover:text-arthaflow-teal transition-colors duration-300 font-medium"
            >
              About
            </Link>
            {showSignIn && (
              <Button 
                onClick={() => navigate("/auth")} 
                className="bg-gradient-to-r from-arthaflow-darkpurple via-arthaflow-purple to-arthaflow-teal hover:from-arthaflow-purple hover:to-[#38bdf8] transition-all duration-300 shadow-sm hover:shadow-md"
              >
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleMenu}
              className="text-arthaflow-darkpurple hover:text-arthaflow-teal transition-colors duration-300"
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden backdrop-blur-md bg-white/90 shadow-lg"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/features"
              className="block px-3 py-2 rounded-md text-base font-medium text-arthaflow-darkpurple hover:text-arthaflow-teal hover:bg-gray-50 transition-colors duration-300"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              to="/about"
              className="block px-3 py-2 rounded-md text-base font-medium text-arthaflow-darkpurple hover:text-arthaflow-teal hover:bg-gray-50 transition-colors duration-300"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            {showSignIn && (
              <div className="px-3 py-2">
                <Button 
                  onClick={() => {
                    navigate("/auth");
                    setIsMenuOpen(false);
                  }} 
                  className="w-full bg-gradient-to-r from-arthaflow-darkpurple via-arthaflow-purple to-arthaflow-teal hover:from-arthaflow-purple hover:to-[#38bdf8] transition-all duration-300"
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
