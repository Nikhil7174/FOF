import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader2 } from "lucide-react";
import { api } from "@/api";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const { toast } = useToast();
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [agreedToIndemnity, setAgreedToIndemnity] = useState(false);
  const [gender, setGender] = useState<string>("");
  const [communityId, setCommunityId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const navigate = useNavigate();

  const { data: communities = [] } = useQuery({
    queryKey: ["communities"],
    queryFn: api.listCommunities,
  });

  const { data: sports = [] } = useQuery({
    queryKey: ["sports"],
    queryFn: api.listSports,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!agreedToIndemnity) {
      toast({ title: "Agreement Required", description: "Please agree to the indemnity form before submitting.", variant: "destructive" });
      return;
    }
    
    // Validate community selection
    if (!communityId || communityId.trim() === "") {
      toast({ title: "Community Required", description: "Please select a community.", variant: "destructive" });
      return;
    }
    
    // Validate sports selection
    if (selectedSports.length === 0) {
      toast({ title: "Sports Required", description: "Please select at least one sport.", variant: "destructive" });
      return;
    }
    
    // Validate gender selection
    if (!gender || (gender !== "male" && gender !== "female")) {
      toast({ title: "Gender Required", description: "Please select a gender.", variant: "destructive" });
      return;
    }
    
    // Validate password
    if (!password || password.length < 6) {
      toast({ title: "Password Required", description: "Password must be at least 6 characters long.", variant: "destructive" });
      return;
    }
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      toast({ title: "Password Mismatch", description: "Passwords do not match. Please try again.", variant: "destructive" });
      return;
    }
    
    const form = new FormData(e.currentTarget);
    const payload = {
      firstName: String(form.get("firstName") || ""),
      middleName: String(form.get("middleName") || ""),
      lastName: String(form.get("lastName") || ""),
      gender: gender as "male" | "female",
      dob: String(form.get("dob") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      password: password,
      communityId: communityId.trim(),
      nextOfKin: {
        firstName: String(form.get("kinFirstName") || ""),
        middleName: String(form.get("kinMiddleName") || ""),
        lastName: String(form.get("kinLastName") || ""),
        phone: String(form.get("kinPhone") || ""),
      },
      sports: selectedSports.filter(sportId => sportId && sportId.trim() !== ""),
    };
    
    // Final validation: ensure we still have sports after filtering
    if (payload.sports.length === 0) {
      toast({ title: "Sports Required", description: "Please select at least one valid sport.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await api.createParticipant(payload as any);
      
      // Try to send confirmation email, but don't fail if it doesn't work
      try {
        await api.sendRegistrationConfirmation(payload.email);
      } catch (emailError) {
        // Email failed, but registration succeeded - log it but continue
        console.log("Could not send confirmation email:", emailError);
      }
      
      toast({ 
        title: "🎉 Registration Successful!", 
        description: "Your account has been created! You can now login with your email and password. Your application is pending approval.",
        duration: 5000,
      });
      
      // Wait a moment to show the success message, then redirect to login
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      // Extract error message from various possible error formats
      let errorMessage = "Something went wrong. Please try again.";
      
      // Check for validation errors with details array
      if (err?.details && Array.isArray(err.details) && err.details.length > 0) {
        // Format validation errors nicely
        const validationErrors = err.details.map((detail: any) => {
          const path = detail.path?.join(".") || "field";
          return `${path}: ${detail.message}`;
        });
        errorMessage = validationErrors.join(". ");
      } else if (err?.message) {
        // Primary: check error message (from API client)
        errorMessage = err.message;
      } else if (err?.originalError?.error) {
        // Check original error object from API
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

  const toggleSport = (sportId: string) => {
    setSelectedSports((prev) =>
      prev.includes(sportId) ? prev.filter((id) => id !== sportId) : [...prev, sportId]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-hero rounded-full mb-4">
              <UserPlus className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold mb-3">Register for FOF 2026</h1>
            <p className="text-muted-foreground">Join the Festival of Friendship and be part of something special</p>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Participant Information</CardTitle>
              <CardDescription>Please fill in all required fields</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" name="firstName" placeholder="e.g., Ahmed" required disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input id="middleName" name="middleName" placeholder="e.g., Ali" disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" name="lastName" placeholder="e.g., Hassan" required disabled={isSubmitting} />
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
                    <Input id="dob" name="dob" type="date" placeholder="YYYY-MM-DD" required disabled={isSubmitting} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" name="email" type="email" placeholder="e.g., ahmed@example.com" required disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="e.g., +254 712 345 678" required disabled={isSubmitting} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input 
                      id="password" 
                      name="password" 
                      type="password" 
                      placeholder="At least 6 characters" 
                      required 
                      disabled={isSubmitting}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input 
                      id="confirmPassword" 
                      name="confirmPassword" 
                      type="password" 
                      placeholder="Re-enter your password" 
                      required 
                      disabled={isSubmitting}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="community">Community *</Label>
                  <Select required onValueChange={setCommunityId} disabled={isSubmitting}>
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

                {/* Next of Kin Information */}
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4">Next of Kin Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kinFirstName">First Name *</Label>
                      <Input id="kinFirstName" name="kinFirstName" placeholder="e.g., Fatuma" required disabled={isSubmitting} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kinMiddleName">Middle Name</Label>
                      <Input id="kinMiddleName" name="kinMiddleName" placeholder="e.g., Amina" disabled={isSubmitting} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kinLastName">Last Name *</Label>
                      <Input id="kinLastName" name="kinLastName" placeholder="e.g., Mohamed" required disabled={isSubmitting} />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="kinPhone">Phone Number *</Label>
                    <Input id="kinPhone" name="kinPhone" type="tel" placeholder="e.g., +254 700 000 000" required disabled={isSubmitting} />
                  </div>
                </div>

                {/* Sports Selection */}
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4">Sports Selection *</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sports
                      .filter((s: any) => !s.parentId)
                      .map((parent: any) => {
                        const children = sports.filter((s: any) => s.parentId === parent.id);
                        return (
                          <div key={parent.id} className="space-y-2">
                            <div className="font-medium">{parent.name}</div>
                            {children.length > 0 ? (
                              <div className="ml-4 space-y-2">
                                {children.map((child: any) => (
                                  <div key={child.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`sport-${child.id}`}
                                      checked={selectedSports.includes(child.id)}
                                      onCheckedChange={() => toggleSport(child.id)}
                                      disabled={isSubmitting}
                                    />
                                    <Label htmlFor={`sport-${child.id}`} className="text-sm font-normal cursor-pointer">
                                      {child.name}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`sport-${parent.id}`}
                                  checked={selectedSports.includes(parent.id)}
                                  onCheckedChange={() => toggleSport(parent.id)}
                                  disabled={isSubmitting}
                                />
                                <Label htmlFor={`sport-${parent.id}`} className="text-sm font-normal cursor-pointer">
                                  {parent.name}
                                </Label>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Indemnity */}
                <div className="pt-4 border-t">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="indemnity"
                      checked={agreedToIndemnity}
                      onCheckedChange={(checked) => setAgreedToIndemnity(checked as boolean)}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="indemnity" className="text-sm font-normal cursor-pointer leading-relaxed">
                      I hereby acknowledge that I participate in FOF 2026 at my own risk and agree to hold
                      harmless the organizers from any liability for injuries or damages incurred during the event. *
                    </Label>
                  </div>
                </div>

                <Button type="submit" size="lg" variant="hero" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Submit Registration
                    </>
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
