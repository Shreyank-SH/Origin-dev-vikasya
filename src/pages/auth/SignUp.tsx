import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SignUpForm } from "@/components/auth/SignUpForm";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignUp = async (formData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => {
    setIsLoading(true);
    console.log("Starting signup process with data:", {
      email: formData.email,
      role: formData.role,
      name: formData.name
    });

    try {
      // Clean and validate the data
      const cleanedData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            name: formData.name.trim(),
            role: formData.role as UserRole,
            email: formData.email.trim().toLowerCase(),
          },
        },
      };

      console.log("Attempting signup with cleaned data:", {
        ...cleanedData,
        password: "[REDACTED]"
      });

      // Sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp(cleanedData);

      if (error) {
        console.error("Supabase signup error:", error);
        throw error;
      }

      if (!data.user) {
        throw new Error("No user data returned from signup");
      }

      console.log("Signup successful:", {
        userId: data.user.id,
        email: data.user.email
      });

      toast({
        title: "Account created successfully!",
        description: "You can now sign in with your credentials.",
      });
      
      navigate("/auth/signin");
    } catch (error: any) {
      console.error("Signup process error:", error);
      
      let errorMessage = "An error occurred during signup.";
      
      if (error.message?.toLowerCase().includes("database")) {
        errorMessage = "There was an issue creating your account. Please try again later.";
      } else if (error.message?.toLowerCase().includes("email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message?.toLowerCase().includes("password")) {
        errorMessage = "Password must be at least 6 characters long.";
      } else {
        errorMessage = error.message || "An unexpected error occurred";
      }
      
      toast({
        title: "Sign up failed",
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
          <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
          <p className="text-muted-foreground">
            Join Boss Y to get started
          </p>
        </div>
        <SignUpForm onSubmit={handleSignUp} isLoading={isLoading} />
        <div className="text-center">
          <Button
            variant="link"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/auth/signin")}
            disabled={isLoading}
          >
            Already have an account? Sign in
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}