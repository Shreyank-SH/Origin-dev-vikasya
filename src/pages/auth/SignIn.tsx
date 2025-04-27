import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Starting sign in process for:", email.trim());

      // Attempt sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }

      if (!data.user || !data.session) {
        throw new Error("No user data returned from authentication");
      }

      console.log("Sign in successful:", data.user);
      
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
        variant: "default",
      });

      // Get the return path or default to /feed
      const returnTo = location.state?.returnTo || "/feed";
      navigate(returnTo);
    } catch (error: any) {
      console.error("Sign in process error:", error);
      let errorMessage = "Invalid email or password.";
      
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Incorrect email or password. Please try again.";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Please verify your email address before signing in.";
      } else if (error.message?.includes("No account found")) {
        errorMessage = "No account found with this email. Please sign up first.";
      } else if (error.message?.includes("Database error")) {
        errorMessage = "We're experiencing technical difficulties. Please try again later.";
      }
      
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Boss Y</h1>
          <p className="text-muted-foreground">
            Enter your credentials to access your account
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-sage-600 hover:bg-sage-700"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <div className="text-center space-y-2">
          <Button
            variant="link"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/auth/signup")}
            disabled={isLoading}
          >
            Don't have an account? Sign up
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}