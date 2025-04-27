import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        console.log("Starting auth check...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }

        if (!session) {
          console.log("No session found, redirecting to signin");
          if (!location.pathname.includes('/auth/')) {
            navigate("/auth/signin", { 
              replace: true,
              state: { returnTo: location.pathname }
            });
          }
          if (mounted) {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          return;
        }

        // Session refresh logic
        const { data: { user }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error("Session refresh error:", refreshError);
          // Handle refresh error
          await supabase.auth.signOut();
          if (!location.pathname.includes('/auth/')) {
            navigate("/auth/signin", { 
              replace: true,
              state: { returnTo: location.pathname }
            });
          }
          if (mounted) {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          return;
        }

        if (!user) {
          console.error("No user after refresh");
          await supabase.auth.signOut();
          if (!location.pathname.includes('/auth/')) {
            navigate("/auth/signin");
          }
          if (mounted) {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          return;
        }

        console.log("Authentication check completed successfully");
        if (mounted) {
          setIsAuthenticated(true);
          setIsLoading(false);
        }

      } catch (error: any) {
        console.error("Auth error:", error);
        let errorMessage = "Please sign in again";
        
        if (error.message?.includes('Database error')) {
          errorMessage = "There was a database error. Please try again later.";
        } else if (error.message?.includes('refresh_token_not_found') || 
                   error.message?.includes('Invalid Refresh Token')) {
          errorMessage = "Your session has expired. Please sign in again.";
        }
        
        toast({
          title: "Authentication Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        await supabase.auth.signOut();
        if (!location.pathname.includes('/auth/')) {
          navigate("/auth/signin", { 
            replace: true,
            state: { returnTo: location.pathname }
          });
        }
        
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    // Initial auth check
    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        if (event === 'SIGNED_OUT') {
          if (mounted) {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          if (!location.pathname.includes('/auth/')) {
            navigate("/auth/signin", { replace: true });
          }
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            if (mounted) {
              setIsAuthenticated(true);
              setIsLoading(false);
            }
            // Check if there's a return path after successful sign in
            const returnTo = location.state?.returnTo;
            if (returnTo && location.pathname === '/auth/signin') {
              navigate(returnTo, { replace: true });
            }
          }
        }
      }
    );

    // Cleanup function
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location, toast]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sage-600" />
      </div>
    );
  }

  // If not authenticated and not on an auth page, show nothing
  if (!isAuthenticated && !location.pathname.includes('/auth/')) {
    return null;
  }

  // If authenticated or on auth page, render children
  return <>{children}</>;
}