import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { communities, sports } from "@/data/mockData";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

export default function Register() {
  const { toast } = useToast();
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [agreedToIndemnity, setAgreedToIndemnity] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToIndemnity) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the indemnity form before submitting.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Registration Successful!",
      description: "Welcome to FOF 2024. Check your email for confirmation.",
    });
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
            <h1 className="text-4xl font-bold mb-3">Register for FOF 2024</h1>
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
                    <Input id="firstName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input id="middleName" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select required>
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
                    <Input id="dob" type="date" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" type="tel" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="community">Community *</Label>
                  <Select required>
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
                      <Input id="kinFirstName" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kinMiddleName">Middle Name</Label>
                      <Input id="kinMiddleName" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kinLastName">Last Name *</Label>
                      <Input id="kinLastName" required />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="kinPhone">Phone Number *</Label>
                    <Input id="kinPhone" type="tel" required />
                  </div>
                </div>

                {/* Sports Selection */}
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4">Sports Selection *</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sports.map((sport) => (
                      <div key={sport.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`sport-${sport.id}`}
                          checked={selectedSports.includes(sport.id)}
                          onCheckedChange={() => toggleSport(sport.id)}
                        />
                        <Label
                          htmlFor={`sport-${sport.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {sport.name}
                        </Label>
                      </div>
                    ))}
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
                      I hereby acknowledge that I participate in FOF 2024 at my own risk and agree to hold
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
