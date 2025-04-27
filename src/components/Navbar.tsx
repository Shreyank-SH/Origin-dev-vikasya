import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home,
  Briefcase,
  Award,
  Users,
  Calendar,
  BookOpen,
  FileText,
  Bell,
  User,
  Menu,
  LogOut,
  Settings
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth/signin", { replace: true });
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-sage-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/feed" className="flex items-center space-x-2">
              <img src="/logo.svg" alt="Boss Y Logo" className="w-8 h-8" />
              <span className="text-xl font-bold text-sage-700">Boss Y</span>
            </Link>
            <div className="hidden md:flex space-x-4">
              <NavLink to="/feed" icon={<Home size={18} />} label="Feed" />
              <NavLink to="/projects" icon={<Briefcase size={18} />} label="Projects" />
              <NavLink to="/opportunities" icon={<Award size={18} />} label="Opportunities" />
              <NavLink to="/people" icon={<Users size={18} />} label="People" />
              <NavLink to="/events" icon={<Calendar size={18} />} label="Events" />
              <NavLink to="/clubs" icon={<Users size={18} />} label="Clubs" />
              <NavLink to="/portfolios" icon={<FileText size={18} />} label="Portfolios" />
              <NavLink to="/tutorials" icon={<BookOpen size={18} />} label="Tutorials" />
              {isAdmin && (
                <NavLink to="/admin" icon={<Settings size={18} />} label="Admin" />
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-sage-500 rounded-full" />
            </Button>
            <Link to="/profile">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4 mt-6">
                  <MobileNavLink to="/feed" icon={<Home size={18} />} label="Feed" />
                  <MobileNavLink to="/projects" icon={<Briefcase size={18} />} label="Projects" />
                  <MobileNavLink to="/opportunities" icon={<Award size={18} />} label="Opportunities" />
                  <MobileNavLink to="/people" icon={<Users size={18} />} label="People" />
                  <MobileNavLink to="/events" icon={<Calendar size={18} />} label="Events" />
                  <MobileNavLink to="/clubs" icon={<Users size={18} />} label="Clubs" />
                  <MobileNavLink to="/portfolios" icon={<FileText size={18} />} label="Portfolios" />
                  <MobileNavLink to="/tutorials" icon={<BookOpen size={18} />} label="Tutorials" />
                  {isAdmin && (
                    <MobileNavLink to="/admin" icon={<Settings size={18} />} label="Admin" />
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
  <Link
    to={to}
    className="flex items-center space-x-1 text-sage-600 hover:text-sage-800 transition-colors"
  >
    {icon}
    <span>{label}</span>
  </Link>
);

const MobileNavLink = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
  <Link
    to={to}
    className="flex items-center space-x-3 text-sage-600 hover:text-sage-800 transition-colors p-2 rounded-md hover:bg-sage-50"
  >
    {icon}
    <span className="text-base">{label}</span>
  </Link>
);

export default Navbar;