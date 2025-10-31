import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { departments } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { Heart } from "lucide-react";
import { api } from "@/api";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Volunteer() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [gender, setGender] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const firstName = String(form.get("firstName") || "");
    const lastName = String(form.get("lastName") || "");
    const email = String(form.get("email") || "");
    const username = String(form.get("username") || "");
    const password = String(form.get("password") || "");

    try {
      // Create volunteer entry
      await api.createVolunteer({
        firstName,
        middleName: String(form.get("middleName") || ""),
        lastName,
        gender: (gender || "male") as "male" | "female",
        dob: String(form.get("dob") || ""),
        email,
        phone: String(form.get("phone") || ""),
        departmentId,
      });

      // Create user account
      await api.signup("volunteer", username, password);

      // Send email
      await api.sendEmail(email, "Thank You for Volunteering", "We'll contact you soon with more details.");

      toast({ title: "Thank You for Volunteering!", description: "We'll contact you soon with more details." });
      navigate("/thank-you");
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
              <Heart className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold mb-3">Volunteer Sign-Up</h1>
            <p className="text-muted-foreground">
              Help make FOF 2026 a success! Join our team of dedicated volunteers
            </p>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Volunteer Information</CardTitle>
              <CardDescription>We appreciate your willingness to help</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" name="firstName" placeholder="e.g., Sarah" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input id="middleName" name="middleName" placeholder="e.g., W." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" name="lastName" placeholder="e.g., Njeri" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select required onValueChange={setGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input id="dob" name="dob" type="date" placeholder="YYYY-MM-DD" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" name="email" type="email" placeholder="e.g., sarah@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="e.g., +254 723 456 789" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Preferred Department *</Label>
                  <Select required onValueChange={setDepartmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  Submit Application
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
