import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BadgeCheck, BarChart3, ChevronRight, CreditCard, DollarSign, Gift, LineChart, Lock, Percent, PiggyBank, Shield, Sparkles, Star, Target, Wallet } from "lucide-react";

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: any; 
  title: string; 
  description: string 
}) => {
  return (
    <Card className="overflow-hidden border-gray-200 transition-colors hover:border-gray-300">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-1 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
};

const TestimonialCard = ({
  name,
  role,
  quote,
  avatar
}: {
  name: string;
  role: string;
  quote: string;
  avatar: string;
}) => {
  return (
    <div className="rounded-lg border bg-card p-6 shadow transition-all duration-200 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-100">
          <img 
            src={avatar} 
            alt={name} 
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>
      <blockquote className="mt-4 italic text-muted-foreground">
        "{quote}"
      </blockquote>
    </div>
  );
};

const Welcome = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  
  // Create refs for scroll sections
  const featuresRef = useRef(null);
  const howitworksRef = useRef(null);
  const testimonialsRef = useRef(null);
  
  // Use inView to detect when sections are in view
  const featuresInView = useInView(featuresRef, { once: true });
  const howitworksInView = useInView(howitworksRef, { once: true });
  const testimonialsInView = useInView(testimonialsRef, { once: true });

  const features = [
    {
      title: "Expense Tracking",
      description: "Easily track all your expenses in one place. Categorize and analyze your spending patterns.",
      icon: Wallet,
    },
    {
      title: "Budget Management",
      description: "Create and manage budgets for different expense categories. Get alerts when you're nearing your limits.",
      icon: PiggyBank,
    },
    {
      title: "Financial Insights",
      description: "Get personalized insights and recommendations to improve your financial health.",
      icon: LineChart,
    },
    {
      title: "Goal Setting",
      description: "Set financial goals and track your progress. Whether it's saving for a vacation or buying a home.",
      icon: Target,
    },
    {
      title: "Rewards & Achievements",
      description: "Earn points and unlock achievements as you improve your financial behavior.",
      icon: Gift,
    },
    {
      title: "Bill Reminders",
      description: "Never miss a payment with customizable bill reminders and notifications.",
      icon: CreditCard,
    }
  ];

  const detailedFeatures = [
    {
      title: "Smart Transaction Categorization",
      description: "Our intelligent system automatically categorizes your transactions, saving you time and effort in manual entry.",
      icon: Sparkles,
    },
    {
      title: "Visual Analytics",
      description: "View beautiful charts and graphs that make it easy to understand your financial patterns at a glance.",
      icon: BarChart3,
    },
    {
      title: "Financial Challenges",
      description: "Participate in financial challenges designed to help you save more and spend wisely.",
      icon: Star,
    },
    {
      title: "Secure Data Storage",
      description: "Your financial data is encrypted and protected with the highest security standards.",
      icon: Shield,
    },
    {
      title: "Multiple Currency Support",
      description: "Track expenses in multiple currencies, perfect for travelers and international users.",
      icon: DollarSign,
    },
    {
      title: "Premium Benefits",
      description: "Upgrade to premium for advanced features like investment tracking and tax optimization.",
      icon: BadgeCheck,
    }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Small Business Owner",
      quote: "ArthaFlow has revolutionized how I manage both personal and business finances. The intuitive interface makes tracking expenses effortless.",
      avatar: "https://i.pravatar.cc/150?img=32",
    },
    {
      name: "Rahul Mehta",
      role: "Software Engineer",
      quote: "As someone who struggles with financial planning, this app has been a game-changer. The challenges feature makes saving money actually fun!",
      avatar: "https://i.pravatar.cc/150?img=59",
    },
    {
      name: "Ananya Patel",
      role: "Marketing Executive",
      quote: "I've tried many finance apps, but ArthaFlow stands out with its personalized insights. I've saved 20% more since I started using it.",
      avatar: "https://i.pravatar.cc/150?img=47",
    },
    {
      name: "Vikram Singh",
      role: "College Student",
      quote: "Perfect for students on a budget! The app helped me track my expenses and even save enough for a trip abroad during summer break.",
      avatar: "https://i.pravatar.cc/150?img=67",
    }
  ];

  const handleFeatureClick = (index: number) => {
    setActiveFeature(index);
  };

  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-b from-white to-gray-50">
      <Navbar transparent />
      
      {/* Hero Section */}
      <section className="flex flex-1 items-center justify-center px-4 pt-20 lg:px-8 lg:pt-32">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col justify-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Simplify Your <span className="bg-gradient-to-r from-arthaflow-purple to-arthaflow-teal bg-clip-text text-transparent">Financial Life</span>
              </h1>
              <p className="max-w-md text-lg text-muted-foreground">
                Track expenses, set budgets, achieve financial goals, and earn rewards - all in one beautiful app.
              </p>
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-arthaflow-darkpurple via-arthaflow-purple to-arthaflow-teal hover:from-arthaflow-purple hover:to-[#38bdf8]"
                  onClick={() => navigate("/auth")}
                >
                  Get Started
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => scrollToSection(featuresRef)}
                >
                  Learn More
                </Button>
              </div>
              {/* User count section removed */}
            </div>
            <div className="relative flex items-center justify-center">
              <div className="absolute -z-10 h-72 w-72 rounded-full bg-gradient-to-r from-arthaflow-purple/20 to-arthaflow-teal/20 blur-3xl"></div>
              <div className="relative overflow-hidden rounded-xl border bg-background p-2 shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1554224154-26032ffc0d07?q=80&w=2026&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Dashboard Preview"
                  className="rounded-lg shadow-sm"
                  width="600"
                  height="400"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section ref={featuresRef} className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Master Your Finances
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              ArthaFlow combines powerful financial tools with an intuitive interface to help you take control of your money.
            </p>
          </motion.div>
          
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              >
                <FeatureCard 
                  icon={feature.icon} 
                  title={feature.title} 
                  description={feature.description} 
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section ref={howitworksRef} className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={howitworksInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How ArthaFlow Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our simple approach to financial management makes it easy to achieve your money goals.
            </p>
          </motion.div>
          
          <div className="mt-16">
            <div className="grid gap-12 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={howitworksInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col justify-center space-y-8"
              >
                <div className="space-y-2">
                  <div 
                    className="flex cursor-pointer items-center space-x-3 rounded-lg border border-transparent bg-muted p-3 transition-colors hover:border-border hover:bg-background"
                    onClick={() => handleFeatureClick(0)}
                  >
                    <div className={`rounded-full p-1 ${activeFeature === 0 ? 'bg-primary text-white' : 'bg-muted-foreground/20'}`}>
                      <span className="flex h-5 w-5 items-center justify-center font-medium">1</span>
                    </div>
                    <div className="font-medium">Connect your accounts or add transactions manually</div>
                    {activeFeature === 0 && <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />}
                  </div>
                  
                  <div 
                    className="flex cursor-pointer items-center space-x-3 rounded-lg border border-transparent bg-muted p-3 transition-colors hover:border-border hover:bg-background"
                    onClick={() => handleFeatureClick(1)}
                  >
                    <div className={`rounded-full p-1 ${activeFeature === 1 ? 'bg-primary text-white' : 'bg-muted-foreground/20'}`}>
                      <span className="flex h-5 w-5 items-center justify-center font-medium">2</span>
                    </div>
                    <div className="font-medium">Set up personalized budgets and savings goals</div>
                    {activeFeature === 1 && <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />}
                  </div>
                  
                  <div 
                    className="flex cursor-pointer items-center space-x-3 rounded-lg border border-transparent bg-muted p-3 transition-colors hover:border-border hover:bg-background"
                    onClick={() => handleFeatureClick(2)}
                  >
                    <div className={`rounded-full p-1 ${activeFeature === 2 ? 'bg-primary text-white' : 'bg-muted-foreground/20'}`}>
                      <span className="flex h-5 w-5 items-center justify-center font-medium">3</span>
                    </div>
                    <div className="font-medium">Get personalized insights to optimize your finances</div>
                    {activeFeature === 2 && <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />}
                  </div>
                  
                  <div 
                    className="flex cursor-pointer items-center space-x-3 rounded-lg border border-transparent bg-muted p-3 transition-colors hover:border-border hover:bg-background"
                    onClick={() => handleFeatureClick(3)}
                  >
                    <div className={`rounded-full p-1 ${activeFeature === 3 ? 'bg-primary text-white' : 'bg-muted-foreground/20'}`}>
                      <span className="flex h-5 w-5 items-center justify-center font-medium">4</span>
                    </div>
                    <div className="font-medium">Complete challenges and earn rewards for good habits</div>
                    {activeFeature === 3 && <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={howitworksInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="relative flex items-center justify-center overflow-hidden rounded-xl border bg-background p-2 shadow-lg"
              >
                {activeFeature === 0 && (
                  <img
                    src="https://images.unsplash.com/photo-1556155092-490a1ba16284?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Adding transactions"
                    className="h-auto w-full rounded-lg object-cover object-center"
                    style={{ aspectRatio: "16/9" }}
                    loading="lazy"
                  />
                )}
                {activeFeature === 1 && (
                  <img
                    src="https://media.istockphoto.com/id/1467894822/photo/close-up-shot-red-darts-arrows-in-the-target-of-dartboard-center-on-dark-blue-sky-background.webp?a=1&b=1&s=612x612&w=0&k=20&c=hD6W8LcZwacPqLSK8tlh1XtQcrr50aiMrA8XPIofY1M="
                    alt="Setting budgets"
                    className="h-auto w-full rounded-lg object-cover object-center"
                    style={{ aspectRatio: "16/9" }}
                    loading="lazy"
                  />
                )}
                {activeFeature === 2 && (
                  <img
                    src="https://images.unsplash.com/photo-1660970781103-ba6749cb9ce3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGZpbmFuY2lhbCUyMGluc2lnaHR8ZW58MHx8MHx8fDA%3D"
                    alt="Financial insights"
                    className="h-auto w-full rounded-lg object-cover object-center"
                    style={{ aspectRatio: "16/9" }}
                    loading="lazy"
                  />
                )}
                {activeFeature === 3 && (
                  <img
                    src="https://plus.unsplash.com/premium_photo-1672059168057-d33d8d276c27?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8cmV3YXJkc3xlbnwwfHwwfHx8MA%3D%3D"
                    alt="Earning rewards"
                    className="h-auto w-full rounded-lg object-cover object-center"
                    style={{ aspectRatio: "16/9" }}
                    loading="lazy"
                  />
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section removed */}
      
      {/* CTA Section */}
      <section className="bg-gradient-to-r from-arthaflow-darkpurple to-arthaflow-teal py-16 text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Take Control of Your Finances?
            </h2>
            <p className="mt-4 text-lg opacity-90">
              Join ArthaFlow today and start your journey to financial freedom.
            </p>
            <div className="mt-8 flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-arthaflow-darkpurple hover:bg-gray-100"
                onClick={() => navigate("/auth")}
              >
                Get Started for Free
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white bg-transparent hover:bg-white/10 hover:border-dashed"
                onClick={() => scrollToSection(featuresRef)}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <h3 className="mb-4 text-lg font-semibold">ArthaFlow</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About Us</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
                <li><a href="#" className="hover:text-foreground">Press</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold">Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Expense Tracking</a></li>
                <li><a href="#" className="hover:text-foreground">Budgeting</a></li>
                <li><a href="#" className="hover:text-foreground">Savings Goals</a></li>
                <li><a href="#" className="hover:text-foreground">Insights</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground">Community</a></li>
                <li><a href="#" className="hover:text-foreground">Financial Guides</a></li>
                <li><a href="#" className="hover:text-foreground">API Documentation</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground">Security</a></li>
                <li><a href="#" className="hover:text-foreground">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 ArthaFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
