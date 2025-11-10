import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Heart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Volunteer() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [gender, setGender] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const firstName = String(form.get("firstName") || "");
    const lastName = String(form.get("lastName") || "");
    const email = String(form.get("email") || "");

    // Validate password
    if (!password || password.length < 6) {
      toast({ 
        title: "Password Required", 
        description: "Password must be at least 6 characters long.", 
        variant: "destructive" 
      });
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      toast({ 
        title: "Password Mismatch", 
        description: "Passwords do not match. Please try again.", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create volunteer entry with password
      await api.createVolunteer({
        firstName,
        middleName: String(form.get("middleName") || ""),
        lastName,
        gender: (gender || "male") as "male" | "female",
        dob: String(form.get("dob") || ""),
        email,
        phone: String(form.get("phone") || ""),
        password,
      });

      // Try to send confirmation email, but don't fail if it doesn't work
      try {
        await api.sendEmail(email, "Thank You for Volunteering", "We'll contact you soon with more details.");
      } catch (emailError) {
        console.log("Could not send confirmation email:", emailError);
      }

      toast({ 
        title: "🎉 Registration Successful!", 
        description: "Your volunteer account has been created! You can now login with your email and password.",
        duration: 5000,
      });

      // Wait a moment to show the success message, then redirect to volunteer login
      setTimeout(() => {
        navigate("/volunteer-login");
      }, 2000);
    } catch (err: any) {
      let errorMessage = "Something went wrong. Please try again.";
      
      if (err?.details && Array.isArray(err.details) && err.details.length > 0) {
        const validationErrors = err.details.map((detail: any) => {
          const path = detail.path?.join(".") || "field";
          return `${path}: ${detail.message}`;
        });
        errorMessage = validationErrors.join(". ");
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.originalError?.error) {
        errorMessage = err.originalError.error;
      } else if (err?.originalError?.message) {
        errorMessage = err.originalError.message;
      } else if (err?.error) {
        errorMessage = err.error;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      toast({ 
        title: "Registration Failed", 
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
                    <Input 
                      id="firstName" 
                      name="firstName" 
                      placeholder="e.g., Sarah" 
                      required 
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input 
                      id="middleName" 
                      name="middleName" 
                      placeholder="e.g., W." 
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input 
                      id="lastName" 
                      name="lastName" 
                      placeholder="e.g., Njeri" 
                      required 
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select required onValueChange={setGender} disabled={isSubmitting}>
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
                    <Input 
                      id="dob" 
                      name="dob" 
                      type="date" 
                      placeholder="YYYY-MM-DD" 
                      required 
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="e.g., sarah@example.com" 
                      required 
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      type="tel" 
                      placeholder="e.g., +254 723 456 789" 
                      required 
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4">Login Credentials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input 
                        id="password" 
                        name="password" 
                        type="password" 
                        placeholder="Create a password (min 6 characters)" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input 
                        id="confirmPassword" 
                        name="confirmPassword" 
                        type="password" 
                        placeholder="Confirm your password" 
                        required 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" size="lg" variant="hero" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
