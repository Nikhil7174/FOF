import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Loader2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/api";
import { useAuth } from "@/hooks/api/useAuth";
import { useState } from "react";

export default function VolunteerLogin() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Please enter email and password", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Login using email and password
      const loggedInUser = await api.volunteerLogin(email, password);
      
      // Refresh the auth state so ProtectedRoute components see the updated user
      await refreshUser();
      
      // Wait a moment for the auth state to update before navigating
      await new Promise(resolve => setTimeout(resolve, 100));
      
      toast({ title: "Login Successful", description: "Welcome back!" });
      navigate("/dashboard");
    } catch (err: any) {
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
            <CardTitle className="text-2xl">Volunteer Login</CardTitle>
            <CardDescription>Enter your email and password to login</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder="Enter your password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
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
          <div className="px-6 pb-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/volunteer" className="text-primary hover:underline font-medium">
              Sign up as Volunteer
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

