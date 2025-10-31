import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Users } from "lucide-react";
import { api } from "@/api";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function CommunitySignup() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [communityId, setCommunityId] = useState<string>("");
  const { data: communities = [] } = useQuery({ queryKey: ["communities"], queryFn: api.listCommunities });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const username = String(form.get("username") || "");
    const password = String(form.get("password") || "");
    const contactPerson = String(form.get("contactPerson") || "");
    const phone = String(form.get("phone") || "");
    const email = String(form.get("email") || "");

    if (!communityId) {
      toast({ title: "Community Required", description: "Please select a community.", variant: "destructive" });
      return;
    }

    try {
      // Create user account
      await api.signup("community", username, password, { communityId });

      // Update community contact info (in a real app, this would be a separate endpoint)
      // For now, we'll just create the user account

      // Send email
      await api.sendEmail(email, "Community Account Created", "Your community account has been created successfully.");

      toast({ title: "Account Created!", description: "You can now login with your credentials." });
      navigate("/login");
    } catch (err: any) {
      toast({ title: "Signup failed", description: err?.message || "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-hero rounded-full mb-4">
              <Users className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold mb-3">Community Signup</h1>
            <p className="text-muted-foreground">
              Register as a community representative for FOF 2026
            </p>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Community Representative Information</CardTitle>
              <CardDescription>Create an account to manage your community's registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="community">Community *</Label>
                  <Select required onValueChange={setCommunityId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your community" />
                    </SelectTrigger>
                    <SelectContent>
                      {communities.map((community) => (
                        <SelectItem key={community.id} value={community.id}>
                          {community.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person Name *</Label>
                  <Input id="contactPerson" name="contactPerson" placeholder="e.g., Michael Kiplagat" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="e.g., +254 734 333 333" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" name="email" type="email" placeholder="e.g., community@fof.co.ke" required />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4">Login Credentials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <Input id="username" name="username" placeholder="Choose a username" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input id="password" name="password" type="password" placeholder="Create a password" required />
                    </div>
                  </div>
                </div>

                <Button type="submit" size="lg" variant="hero" className="w-full">
                  Create Account
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

