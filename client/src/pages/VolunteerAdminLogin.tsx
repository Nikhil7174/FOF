import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";
import { useAuth } from "@/hooks/api/useAuth";
import { useNavigate } from "react-router-dom";
import { api } from "@/api";
import { useState } from "react";

export default function VolunteerAdminLogin() {
  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Find user by email and role
      const users = await api.listUsers();
      const user = users.find((u: any) => u.email === email && u.role === "volunteer_admin");
      if (!user) {
        toast({ title: "Login failed", description: "Invalid email or password", variant: "destructive" });
        return;
      }
      // Login with username
      await login(user.username, password);
      toast({ title: "Login Successful", description: "Welcome back!" });
      navigate("/volunteer-admin");
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
            <CardTitle className="text-2xl">Volunteer Admin Login</CardTitle>
            <CardDescription>Enter your credentials to sign in</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" name="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" variant="hero" className="w-full">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

