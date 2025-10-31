import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";
import { useAuth } from "@/hooks/api/useAuth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const username = String(form.get("username") || "");
    const password = String(form.get("password") || "");
    try {
      // demo users: admin/admin, nairobi/community, volunteer/volunteer
      await login(username, password);
      toast({ title: "Login Successful", description: "Welcome back to FOF 2026!" });
      // fetch role via me() is async in provider; navigate based on username to keep simple
      if (username === "admin") navigate("/admin");
      else if (username === "nairobi" || username.startsWith("comm")) navigate("/community");
      else navigate("/"); // volunteers don't have a dashboard
    } catch (err: any) {
      toast({ title: "Login failed", description: err?.message || "Invalid credentials", variant: "destructive" });
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
            <CardDescription>Access your FOF 2026 account (Admin, Community, or Volunteer)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username or Email</Label>
                <Input id="username" name="username" type="text" placeholder="e.g., admin or user@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="Enter your password" required />
              </div>
              <Button type="submit" variant="hero" className="w-full">
                Sign In
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
            <div className="flex flex-col gap-2 text-sm text-center">
              <Link to="/community-signup" className="text-primary hover:underline font-medium">
                Community Signup
              </Link>
              <Link to="/volunteer" className="text-secondary hover:underline font-medium">
                Volunteer Sign-Up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
