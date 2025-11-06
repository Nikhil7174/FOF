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
import { UserPlus } from "lucide-react";
import { api } from "@/api";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const { toast } = useToast();
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [agreedToIndemnity, setAgreedToIndemnity] = useState(false);
  const [gender, setGender] = useState<string>("");
  const [communityId, setCommunityId] = useState<string>("");
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
    const form = new FormData(e.currentTarget);
    const payload = {
      firstName: String(form.get("firstName") || ""),
      middleName: String(form.get("middleName") || ""),
      lastName: String(form.get("lastName") || ""),
      gender: (gender || "male") as "male" | "female",
      dob: String(form.get("dob") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      communityId: communityId,
      nextOfKin: {
        firstName: String(form.get("kinFirstName") || ""),
        middleName: String(form.get("kinMiddleName") || ""),
        lastName: String(form.get("kinLastName") || ""),
        phone: String(form.get("kinPhone") || ""),
      },
      sports: selectedSports,
    };
    try {
      await api.createParticipant(payload as any);
      await api.sendEmail(payload.email, "FOF Registration Received", "Thank you for registering for FOF 2026.");
      toast({ title: "Registration Successful!", description: "Check your email for confirmation." });
      navigate("/thank-you");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err?.message || "Please try again.", variant: "destructive" });
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
                    <Input id="firstName" name="firstName" placeholder="e.g., Ahmed" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input id="middleName" name="middleName" placeholder="e.g., Ali" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" name="lastName" placeholder="e.g., Hassan" required />
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
                    <Input id="email" name="email" type="email" placeholder="e.g., ahmed@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="e.g., +254 712 345 678" required />
                  </div>
                </div>

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

                {/* Next of Kin Information */}
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4">Next of Kin Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kinFirstName">First Name *</Label>
                      <Input id="kinFirstName" name="kinFirstName" placeholder="e.g., Fatuma" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kinMiddleName">Middle Name</Label>
                      <Input id="kinMiddleName" name="kinMiddleName" placeholder="e.g., Amina" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kinLastName">Last Name *</Label>
                      <Input id="kinLastName" name="kinLastName" placeholder="e.g., Mohamed" required />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="kinPhone">Phone Number *</Label>
                    <Input id="kinPhone" name="kinPhone" type="tel" placeholder="e.g., +254 700 000 000" required />
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
                    />
                    <Label htmlFor="indemnity" className="text-sm font-normal cursor-pointer leading-relaxed">
                      I hereby acknowledge that I participate in FOF 2026 at my own risk and agree to hold
                      harmless the organizers from any liability for injuries or damages incurred during the event. *
                    </Label>
                  </div>
                </div>

                <Button type="submit" size="lg" variant="hero" className="w-full">
                  Submit Registration
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
