import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/api/useAuth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const username = String(form.get("username") || "");
    const password = String(form.get("password") || "");
    
    setIsSubmitting(true);
    
    try {
      // demo users: admin/admin, nairobi/community, volunteer/volunteer
      const user = await login(username, password);
      toast({ title: "Login Successful", description: "Welcome back to FOF 2026!" });
      
      // Wait a moment for the auth state to update before navigating
      // This ensures ProtectedRoute components see the updated user state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use the user object returned from login
      const role = user.role;
      if (role === "admin") navigate("/admin");
      else if (role === "community_admin") navigate("/community");
      else if (role === "sports_admin") navigate("/sports-admin");
      else if (role === "volunteer_admin") navigate("/volunteer-admin");
      else navigate("/");
    } catch (err: any) {
      // Extract error message from various possible error formats
      let errorMessage = "Invalid credentials. Please try again.";
      
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.originalError?.error) {
        errorMessage = err.originalError.error;
      } else if (err?.originalError?.message) {
        errorMessage = err.originalError.message;
      } else if (err?.error) {
        errorMessage = err.error;
      } else if (typeof err === "string") {
        errorMessage = err;
      }
      
      toast({ 
        title: "Login Failed", 
        description: errorMessage, 
        variant: "destructive",
        duration: 5000,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md shadow-card animate-fade-in">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-hero rounded-full mb-4 mx-auto">
              <LogIn className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  name="username" 
                  type="text" 
                  placeholder="e.g., admin_user" 
                  required 
                  disabled={isSubmitting}
                  autoComplete="username"
                  spellCheck={false}
                />
                <p className="text-xs text-muted-foreground">
                  Use the username you created during registration.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder="Enter your password" 
                  required 
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Register as Participant
              </Link>
            </div>
            <div className="text-sm text-center text-muted-foreground">
              Want to help out?{" "}
              <Link to="/volunteer" className="text-primary hover:underline font-medium">
                Sign up as a Volunteer
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
