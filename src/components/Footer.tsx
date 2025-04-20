import { Facebook, Instagram, Twitter, Linkedin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full pt-16 pb-8 overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-arthaflow-purple/20 rounded-full filter blur-3xl opacity-50"></div>
      <div className="absolute -bottom-24 right-0 w-80 h-80 bg-arthaflow-teal/20 rounded-full filter blur-3xl opacity-50"></div>
      
      {/* Glass container */}
      <div className="relative container mx-auto backdrop-blur-sm bg-white/60 rounded-2xl shadow-xl border border-white/20 p-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Logo and about */}
          <div className="col-span-1 md:col-span-1">
            <div className="mb-4 text-2xl font-extrabold flex items-center">
              <span className="bg-gradient-to-r from-arthaflow-darkpurple to-arthaflow-purple text-transparent bg-clip-text drop-shadow-sm">Artha</span>
              <span className="bg-gradient-to-r from-arthaflow-teal to-arthaflow-lightpurple text-transparent bg-clip-text drop-shadow-sm">Flow</span>
            </div>
            <p className="text-[#444444] mb-6">
              Your comprehensive financial management platform that helps you track expenses, set budgets, and achieve financial goals.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-40 transition-all duration-300 hover:scale-110 text-arthaflow-purple hover:text-arthaflow-teal">
                <Facebook size={18} />
              </a>
              <a href="#" className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-40 transition-all duration-300 hover:scale-110 text-arthaflow-purple hover:text-arthaflow-teal">
                <Instagram size={18} />
              </a>
              <a href="#" className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-40 transition-all duration-300 hover:scale-110 text-arthaflow-purple hover:text-arthaflow-teal">
                <Twitter size={18} />
              </a>
              <a href="#" className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-40 transition-all duration-300 hover:scale-110 text-arthaflow-purple hover:text-arthaflow-teal">
                <Linkedin size={18} />
              </a>
            </div>
          </div>
          
          {/* Quick links */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-[#333333]">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a onClick={() => navigate("/features")} className="text-[#444444] hover:text-arthaflow-teal transition-colors duration-300 flex items-center cursor-pointer">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Features
                </a>
              </li>
              <li>
                <a onClick={() => navigate("/about")} className="text-[#444444] hover:text-arthaflow-teal transition-colors duration-300 flex items-center cursor-pointer">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  About
                </a>
              </li>
              <li>
                <a onClick={() => navigate("/auth")} className="text-[#444444] hover:text-arthaflow-teal transition-colors duration-300 flex items-center cursor-pointer">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Sign In
                </a>
              </li>
            </ul>
          </div>
          
          
          {/* Newsletter */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-[#333333]">Newsletter</h3>
            <p className="text-[#444444] mb-4">Subscribe to our newsletter for updates</p>
            <div className="flex flex-col space-y-2">
              <Input 
                type="email" 
                placeholder="Your email" 
                className="bg-white/70 border border-white/30 focus:border-arthaflow-purple"
              />
              <Button className="bg-gradient-to-r from-arthaflow-darkpurple via-arthaflow-purple to-arthaflow-teal hover:from-arthaflow-purple hover:to-[#38bdf8] transition-all duration-300">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/30 to-transparent my-8"></div>
        
        {/* Copyright */}
        <div className="text-center text-[#666666] text-sm">
          <p>© {currentYear} ArthaFlow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

