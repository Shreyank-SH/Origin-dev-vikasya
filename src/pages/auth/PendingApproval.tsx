import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export default function PendingApproval() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(null); // Manage auth state

  useEffect(() => {
    // Simulating auth check (Replace with actual auth logic)
    const user = JSON.parse(localStorage.getItem("user")); // Retrieve stored user data
    if (!user) {
      navigate("/auth/signin"); // Redirect if user is not authenticated
    } else {
      setIsAuthenticated(user); // Set user state
    }
  }, [navigate]);

  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>; // Show loader while checking auth
  }

  return (
    <AuthLayout>
      <div className="text-center space-y-6">
        {/* Clock Icon */}
        <div className="flex justify-center">
          <Clock className="h-16 w-16 text-green-500" strokeWidth={1.5} />
        </div>

        {/* Heading & Message */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Pending Approval</h1>
          <p className="text-gray-500">
            Your account is currently pending admin approval. You'll receive an
            email once your account has been approved.
          </p>
        </div>

        {/* Return to Sign In Button */}
        <Button
          variant="outline"
          onClick={() => navigate("/auth/signin")}
          className="hover:bg-gray-100"
        >
          Return to Sign In
        </Button>
      </div>
    </AuthLayout>
  );
}
