import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader2, ChevronDown } from "lucide-react";
import { api, type CreateParticipantInput } from "@/api";
import { useNavigate } from "react-router-dom";

const usernamePattern = /^[a-zA-Z0-9_.-]{3,30}$/;

export default function Register() {
  const { toast } = useToast();
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [agreedToIndemnity, setAgreedToIndemnity] = useState(false);
  const [gender, setGender] = useState<string>("");
  const [communityId, setCommunityId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isSportsSectionOpen, setIsSportsSectionOpen] = useState(false);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [dob, setDob] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [usernameFeedback, setUsernameFeedback] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [kinFirstName, setKinFirstName] = useState<string>("");
  const [kinLastName, setKinLastName] = useState<string>("");
  const [kinPhone, setKinPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const navigate = useNavigate();

  // Auto-open sports section when all required fields are filled
  useEffect(() => {
    // Check if all required fields are filled
    const allFieldsFilled = 
      firstName.trim() &&
      lastName.trim() &&
      gender &&
      dob.trim() &&
      username.trim() &&
      email.trim() &&
      phone.trim() &&
      password &&
      confirmPassword &&
      communityId &&
      kinFirstName.trim() &&
      kinLastName.trim() &&
      kinPhone.trim() &&
      notes.trim();

    // Auto-open sports section if all fields are filled and it's currently closed
    if (allFieldsFilled && !isSportsSectionOpen) {
      setIsSportsSectionOpen(true);
    }
  }, [firstName, lastName, gender, dob, username, email, phone, password, confirmPassword, communityId, kinFirstName, kinLastName, kinPhone, notes, isSportsSectionOpen]);

  useEffect(() => {
    const trimmed = username.trim();

    if (!trimmed) {
      setIsUsernameAvailable(null);
      setUsernameFeedback("");
      setIsCheckingUsername(false);
      return;
    }

    if (!usernamePattern.test(trimmed)) {
      setIsUsernameAvailable(false);
      setUsernameFeedback("Use 3-30 letters, numbers, dots, hyphens or underscores.");
      setIsCheckingUsername(false);
      return;
    }

    let cancelled = false;
    setIsCheckingUsername(true);
    setUsernameFeedback("Checking availability...");

    const handler = window.setTimeout(async () => {
      try {
        const available = await api.checkUsernameAvailability(trimmed);
        if (cancelled) return;
        setIsUsernameAvailable(available);
        setUsernameFeedback(available ? "Username is available!" : "This username is already taken.");
      } catch {
        if (cancelled) return;
        setIsUsernameAvailable(false);
        setUsernameFeedback("Couldn't verify username. Please try again.");
      } finally {
        if (!cancelled) {
          setIsCheckingUsername(false);
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(handler);
    };
  }, [username]);

  const { data: communities = [] } = useQuery({
    queryKey: ["communities"],
    queryFn: api.listCommunities,
  });

  const { data: sports = [] } = useQuery({
    queryKey: ["sports"],
    queryFn: api.listSports,
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.getSettings,
  });

  const formatReferenceDate = (dateString?: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const ageReferenceDate = settings?.ageCalculatorDate ? new Date(settings.ageCalculatorDate) : null;
  const ageReferenceLabel = ageReferenceDate ? formatReferenceDate(settings?.ageCalculatorDate) : null;

  const calculateAge = (dobValue: string) => {
    if (!dobValue) return null;
    const birthDate = new Date(dobValue);
    if (isNaN(birthDate.getTime())) return null;
    const reference = ageReferenceDate ?? new Date();
    let age = reference.getFullYear() - birthDate.getFullYear();
    const monthDiff = reference.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculatedAge = calculateAge(dob);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    
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

    if (!trimmedUsername) {
      toast({ title: "Username Required", description: "Please choose a username.", variant: "destructive" });
      return;
    }

    if (!usernamePattern.test(trimmedUsername)) {
      toast({ title: "Invalid Username", description: "Use 3-30 letters, numbers, dots, hyphens or underscores.", variant: "destructive" });
      return;
    }

    if (isCheckingUsername) {
      toast({ title: "Hold On", description: "Please wait for the username check to finish.", variant: "destructive" });
      return;
    }

    if (isUsernameAvailable !== true) {
      toast({ title: "Username Unavailable", description: usernameFeedback || "Please choose a different username.", variant: "destructive" });
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
    
    // Validate payment details (notes)
    const trimmedNotes = notes.trim();
    if (!trimmedNotes) {
      toast({ title: "Payment Details Required", description: "Please provide payment details.", variant: "destructive" });
      return;
    }
    
    const form = new FormData(e.currentTarget);

    const payload: CreateParticipantInput = {
      firstName: String(form.get("firstName") || ""),
      middleName: String(form.get("middleName") || ""),
      lastName: String(form.get("lastName") || ""),
      gender: gender as "male" | "female",
      dob: String(form.get("dob") || ""),
      email: String(form.get("email") || ""),
      username: trimmedUsername,
      phone: String(form.get("phone") || ""),
      password: password,
      communityId: communityId.trim(),
      nextOfKin: {
        firstName: String(form.get("kinFirstName") || ""),
        middleName: String(form.get("kinMiddleName") || ""),
        lastName: String(form.get("kinLastName") || ""),
        phone: String(form.get("kinPhone") || ""),
      },
      sports: selectedSports.filter((sportId) => sportId && sportId.trim() !== ""),
      notes: trimmedNotes,
    };
    
    // Final validation: ensure we still have sports after filtering
    if (payload.sports.length === 0) {
      toast({ title: "Sports Required", description: "Please select at least one valid sport.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await api.createParticipant(payload);
      
      // Try to send confirmation email, but don't fail if it doesn't work
      try {
        await api.sendRegistrationConfirmation(payload.email);
      } catch (emailError) {
        // Email failed, but registration succeeded - log it but continue
        console.log("Could not send confirmation email:", emailError);
      }
      
      toast({ 
        title: "🎉 Registration Successful!", 
        description: `Your account has been created! Use your username (${trimmedUsername}) and password to log in once approved.`,
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
    const sport = sports.find((s) => s.id === sportId);
    if (!sport) return;

    // If deselecting, just remove it
    if (selectedSports.includes(sportId)) {
      setSelectedSports((prev) => prev.filter((id) => id !== sportId));
      return;
    }

    // Check for incompatible sports before adding
    const incompatibleIds = (sport as any).incompatibleWith?.map((inc: any) => inc.incompatibleSportId) || [];
    const hasIncompatible = selectedSports.some((selectedId) => incompatibleIds.includes(selectedId));
    
    if (hasIncompatible) {
      const incompatibleSport = sports.find((s) => 
        selectedSports.includes(s.id) && incompatibleIds.includes(s.id)
      );
      toast({ 
        title: "Incompatible Sports", 
        description: `Cannot select ${sport.name} with ${incompatibleSport?.name || 'the selected sport(s)'}. These sports are incompatible.`, 
        variant: "destructive" 
      });
      return;
    }

    // Also check if any already selected sport is incompatible with this one
    for (const selectedId of selectedSports) {
      const selectedSport = sports.find((s) => s.id === selectedId);
      if (selectedSport) {
        const selectedIncompatibleIds = (selectedSport as any).incompatibleWith?.map((inc: any) => inc.incompatibleSportId) || [];
        if (selectedIncompatibleIds.includes(sportId)) {
          toast({ 
            title: "Incompatible Sports", 
            description: `Cannot select ${sport.name} with ${selectedSport.name}. These sports are incompatible.`, 
            variant: "destructive" 
          });
          return;
        }
      }
    }

    // If no conflicts, add the sport
    setSelectedSports((prev) => [...prev, sportId]);
  };

  const usernameHelperText =
    usernameFeedback || "Use 3-30 letters, numbers, dots, hyphens or underscores.";
  const usernameHelperTone =
    isCheckingUsername
      ? "text-muted-foreground"
      : usernameFeedback
      ? isUsernameAvailable
        ? "text-emerald-600"
        : "text-destructive"
      : "text-muted-foreground";

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
                    <Input id="firstName" name="firstName" placeholder="e.g., Ahmed" required disabled={isSubmitting} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input id="middleName" name="middleName" placeholder="e.g., Ali" disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" name="lastName" placeholder="e.g., Hassan" required disabled={isSubmitting} value={lastName} onChange={(e) => setLastName(e.target.value)} />
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
                    <Input id="dob" name="dob" type="date" placeholder="YYYY-MM-DD" required disabled={isSubmitting} value={dob} onChange={(e) => setDob(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" name="email" type="email" placeholder="e.g., ahmed@example.com" required disabled={isSubmitting} value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="e.g., +254 712 345 678" required disabled={isSubmitting} value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Create a Username *</Label>
                  <Input 
                    id="username"
                    name="username"
                    type="text"
                    placeholder="e.g., ahmed_hassan26"
                    required
                    disabled={isSubmitting}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    spellCheck={false}
                  />
                  <p className={`text-xs ${usernameHelperTone}`}>
                    {isCheckingUsername ? "Checking availability..." : usernameHelperText}
                  </p>
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
                      <Input id="kinFirstName" name="kinFirstName" placeholder="e.g., Fatuma" required disabled={isSubmitting} value={kinFirstName} onChange={(e) => setKinFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kinMiddleName">Middle Name</Label>
                      <Input id="kinMiddleName" name="kinMiddleName" placeholder="e.g., Amina" disabled={isSubmitting} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kinLastName">Last Name *</Label>
                      <Input id="kinLastName" name="kinLastName" placeholder="e.g., Mohamed" required disabled={isSubmitting} value={kinLastName} onChange={(e) => setKinLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="kinPhone">Phone Number *</Label>
                    <Input id="kinPhone" name="kinPhone" type="tel" placeholder="e.g., +254 700 000 000" required disabled={isSubmitting} value={kinPhone} onChange={(e) => setKinPhone(e.target.value)} />
                  </div>
                </div>

                {/* Payment Details */}
                <div className="pt-4 border-t">
                  <Label htmlFor="notes">Payment Details *</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Please provide payment details (e.g., payment method, transaction ID, or payment confirmation details)."
                    required
                    disabled={isSubmitting}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Up to 500 characters. Please provide your payment details for registration processing.
                  </p>
                </div>

                {/* Sports Selection */}
                <div className="pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsSportsSectionOpen(!isSportsSectionOpen)}
                    className="flex items-center justify-between w-full text-left mb-4"
                  >
                    <h3 className="text-lg font-semibold">Sports Selection *</h3>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform duration-200 ${
                        isSportsSectionOpen ? "transform rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isSportsSectionOpen && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sports
                      .filter((s: any) => !s.parentId)
                      .map((parent: any) => {
                        const children = sports.filter((s: any) => s.parentId === parent.id);
                        const hasChildren = children.length > 0;
                        
                        return (
                          <div key={parent.id} className="space-y-2">
                            {hasChildren ? (
                              // If parent has children, only show children as selectable
                              <>
                                <div className="font-medium">{parent.name}</div>
                                <div className="ml-4 space-y-2">
                                  {children.map((child: any) => {
                                    // Check if this child is incompatible with any selected sport
                                    const childIncompatibleIds = (child as any).incompatibleWith?.map((inc: any) => inc.incompatibleSportId) || [];
                                    const isIncompatibleWithSelected = selectedSports.some((selectedId) => 
                                      childIncompatibleIds.includes(selectedId)
                                    );
                                    
                                    // Check if any selected sport is incompatible with this child
                                    let isIncompatibleFromSelected = false;
                                    for (const selectedId of selectedSports) {
                                      const selectedSport = sports.find((s: any) => s.id === selectedId);
                                      if (selectedSport) {
                                        const selectedIncompatibleIds = (selectedSport as any).incompatibleWith?.map((inc: any) => inc.incompatibleSportId) || [];
                                        if (selectedIncompatibleIds.includes(child.id)) {
                                          isIncompatibleFromSelected = true;
                                          break;
                                        }
                                      }
                                    }
                                    
                                    const isDisabled = isSubmitting || (selectedSports.length > 0 && (isIncompatibleWithSelected || isIncompatibleFromSelected) && !selectedSports.includes(child.id));
                                    
                                    return (
                                      <div key={child.id} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`sport-${child.id}`}
                                          checked={selectedSports.includes(child.id)}
                                          onCheckedChange={() => toggleSport(child.id)}
                                          disabled={isDisabled}
                                        />
                                        <Label 
                                          htmlFor={`sport-${child.id}`} 
                                          className={`text-sm font-normal ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                        >
                                          {child.name}
                                        </Label>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            ) : (
                              // If parent has no children, show parent as selectable
                              <div className="flex items-center space-x-2">
                                {(() => {
                                  // Check if this parent is incompatible with any selected sport
                                  const parentIncompatibleIds = (parent as any).incompatibleWith?.map((inc: any) => inc.incompatibleSportId) || [];
                                  const isIncompatibleWithSelected = selectedSports.some((selectedId) => 
                                    parentIncompatibleIds.includes(selectedId)
                                  );
                                  
                                  // Check if any selected sport is incompatible with this parent
                                  let isIncompatibleFromSelected = false;
                                  for (const selectedId of selectedSports) {
                                    const selectedSport = sports.find((s: any) => s.id === selectedId);
                                    if (selectedSport) {
                                      const selectedIncompatibleIds = (selectedSport as any).incompatibleWith?.map((inc: any) => inc.incompatibleSportId) || [];
                                      if (selectedIncompatibleIds.includes(parent.id)) {
                                        isIncompatibleFromSelected = true;
                                        break;
                                      }
                                    }
                                  }
                                  
                                  const isDisabled = isSubmitting || (selectedSports.length > 0 && (isIncompatibleWithSelected || isIncompatibleFromSelected) && !selectedSports.includes(parent.id));
                                  
                                  return (
                                    <>
                                      <Checkbox
                                        id={`sport-${parent.id}`}
                                        checked={selectedSports.includes(parent.id)}
                                        onCheckedChange={() => toggleSport(parent.id)}
                                        disabled={isDisabled}
                                      />
                                      <Label 
                                        htmlFor={`sport-${parent.id}`} 
                                        className={`text-sm font-normal ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                      >
                                        {parent.name}
                                      </Label>
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
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

                <Button type="submit" size="lg" variant="hero" className="w-full" disabled={isSubmitting || isCheckingUsername}>
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
