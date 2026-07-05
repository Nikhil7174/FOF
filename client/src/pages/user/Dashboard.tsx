import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { User as UserIcon, CheckCircle2, Clock, XCircle, Edit } from "lucide-react";
import { useAuth } from "@/hooks/api/useAuth";
import { useNavigate } from "react-router-dom";
import type { Participant, SportRecord, VolunteerEntry } from "@/types";

export default function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [isEditingSports, setIsEditingSports] = useState(false);
  const [selectedVolunteerSport, setSelectedVolunteerSport] = useState<string | null>(null);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    nextOfKin: {
      firstName: "",
      middleName: "",
      lastName: "",
      phone: "",
    },
    teamName: "",
    notes: "",
  });

  type VolunteerWithSport = VolunteerEntry & { sport?: SportRecord | null };

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.getSettings,
  });

  // Check if profile updates are frozen
  const isProfileFrozen = () => {
    if (!settings?.profileFreezeDate) return false;
    const now = new Date();
    const freezeDate = new Date(settings.profileFreezeDate);
    freezeDate.setHours(23, 59, 59, 999);
    return now > freezeDate;
  };

  const frozen = isProfileFrozen();
  const freezeDate = settings?.profileFreezeDate
    ? new Date(settings.profileFreezeDate).toLocaleDateString()
    : null;

  // Exit edit mode if frozen
  useEffect(() => {
    if (frozen && isEditingSports) {
      setIsEditingSports(false);
    }
  }, [frozen, isEditingSports]);

  const { data: participant, isLoading: participantLoading, isFetching: participantFetching } = useQuery<Participant | null>({
    queryKey: ["myParticipant"],
    queryFn: api.getMyParticipant,
    enabled: user?.role === "user",
  });
  const hasPendingSports =
    !!participant?.pendingSports && Array.isArray(participant.pendingSports) && participant.pendingSports.length > 0;


  const { data: volunteer, isLoading: volunteerLoading, isFetching: volunteerFetching } = useQuery<VolunteerWithSport | null>({
    queryKey: ["myVolunteer"],
    queryFn: api.getMyVolunteer,
    enabled: user?.role === "volunteer",
  });

  const { data: sports = [], isLoading: sportsLoading, isFetching: sportsFetching } = useQuery({
    queryKey: ["sports"],
    queryFn: () => api.listSports(),
  });

  const activeSports = useMemo(() => sports.filter((sport: any) => sport.active !== false), [sports]);
  const activeSportIds = useMemo(() => new Set(activeSports.map((sport: any) => sport.id)), [activeSports]);
  const ageReferenceDate = settings?.ageCalculatorDate ? new Date(settings.ageCalculatorDate) : null;
  const participantAge = useMemo(() => {
    if (!participant?.dob) return null;
    const birthDate = new Date(participant.dob);
    if (isNaN(birthDate.getTime())) return null;
    const reference = ageReferenceDate ?? new Date();
    let age = reference.getFullYear() - birthDate.getFullYear();
    const monthDiff = reference.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, [participant?.dob, ageReferenceDate]);

  const getGenderRestrictionReason = (sport: any) => {
    if (!participant?.gender || !sport.gender || sport.gender === "mixed") return null;
    return sport.gender !== participant.gender ? `Restricted to ${sport.gender} participants` : null;
  };

  const getAgeRestrictionReason = (sport: any) => {
    if (participantAge === null) return null;
    const minAge = sport.ageLimitMin ?? sport.ageLimit?.min;
    const maxAge = sport.ageLimitMax ?? sport.ageLimit?.max;
    if (minAge != null && participantAge < minAge) return `Minimum age ${minAge}`;
    if (maxAge != null && participantAge > maxAge) return `Maximum age ${maxAge}`;
    return null;
  };

  const getIncompatibilityReason = (sport: any) => {
    if (selectedSports.includes(sport.id)) return null;

    const incompatibleIds = (sport as any).incompatibleWith?.map((inc: any) => inc.incompatibleSportId) || [];
    const incompatibleSport = activeSports.find((selectedSport: any) => {
      const selectedIncompatibleIds =
        (selectedSport as any).incompatibleWith?.map((inc: any) => inc.incompatibleSportId) || [];
      return (
        selectedSports.includes(selectedSport.id) &&
        (incompatibleIds.includes(selectedSport.id) || selectedIncompatibleIds.includes(sport.id))
      );
    });

    return incompatibleSport ? `Conflicts with ${incompatibleSport.name}` : null;
  };

  const getSportUnavailableReason = (sport: any) =>
    getIncompatibilityReason(sport) || getAgeRestrictionReason(sport) || getGenderRestrictionReason(sport);

  const getSportLabelClass = (isUnavailable: boolean, isDisabled: boolean) =>
    `text-sm font-normal ${
      isUnavailable
        ? "cursor-not-allowed rounded px-1 text-destructive bg-destructive/10"
        : isDisabled
        ? "cursor-not-allowed opacity-50"
        : "cursor-pointer"
    }`;

  // Initialize form data when participant or volunteer loads
  useEffect(() => {
    if (participant) {
      // Initialize sports
      if (participant.sports) {
        const sportIds = participant.sports.map((ps: any) => {
          if (typeof ps === 'string') {
            return ps;
          }
          return ps.sportId || ps.sport?.id || ps;
        }).filter((sportId: string) => activeSportIds.has(sportId));
        setSelectedSports(sportIds);
      }
      
      // Initialize profile data
      setProfileData({
        firstName: participant.firstName || "",
        middleName: participant.middleName || "",
        lastName: participant.lastName || "",
        phone: participant.phone || "",
        nextOfKin: participant.nextOfKin as any || {
          firstName: "",
          middleName: "",
          lastName: "",
          phone: "",
        },
        teamName: participant.teamName || "",
        notes: participant.notes || "",
      });
    } else if (volunteer) {
      // Initialize profile data for volunteers
      setProfileData({
        firstName: volunteer.firstName || "",
        middleName: volunteer.middleName || "",
        lastName: volunteer.lastName || "",
        phone: volunteer.phone || "",
        nextOfKin: {
          firstName: "",
          middleName: "",
          lastName: "",
          phone: "",
        },
        teamName: "",
        notes: "",
      });
      
      // Initialize volunteer sport selection
      setSelectedVolunteerSport(volunteer.sportId || null);
    }
    
    // Initialize editing state
    setIsEditingSports(false);
  }, [participant, volunteer, activeSportIds]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) =>
      user?.role === "volunteer"
        ? (api.updateMyVolunteerProfile(data) as any)
        : api.updateParticipantProfile(data),
    onSuccess: () => {
      if (user?.role === "volunteer") {
        queryClient.invalidateQueries({ queryKey: ["myVolunteer"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["myParticipant"] });
      }
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Update Failed",
        description: err?.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSportsMutation = useMutation({
    mutationFn: api.updateParticipantSports,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myParticipant"] });
      setIsEditingSports(false);
      toast({
        title: "Sports Updated",
        description: "Your sport selections have been updated successfully.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Update Failed",
        description: err?.message || "Failed to update sports. Please try again.",
        variant: "destructive",
      });
    },
  });


  const toggleSport = (sportId: string) => {
    // Prevent changes if frozen
    if (frozen) {
      toast({
        title: "Updates Frozen",
        description: "Sports selection updates are frozen. Please contact an administrator if you need to make changes.",
        variant: "destructive",
      });
      return;
    }

    const sport = activeSports.find((s: any) => s.id === sportId);
    if (!sport) return;

    // If deselecting, just remove it
    if (selectedSports.includes(sportId)) {
      setSelectedSports((prev) => prev.filter((id) => id !== sportId));
      return;
    }

    const unavailableReason = getSportUnavailableReason(sport);
    if (unavailableReason) {
      toast({
        title: "Sport Not Eligible",
        description: `${sport.name}: ${unavailableReason}`,
        variant: "destructive",
      });
      return;
    }

    // Check for incompatible sports before adding
    const incompatibleIds = (sport as any).incompatibleWith?.map((inc: any) => inc.incompatibleSportId) || [];
    const hasIncompatible = selectedSports.some((selectedId) => incompatibleIds.includes(selectedId));
    
    if (hasIncompatible) {
      const incompatibleSport = activeSports.find((s: any) => 
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
      const selectedSport = activeSports.find((s: any) => s.id === selectedId);
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

  const handleSaveProfile = () => {
    // Prevent saving if frozen
    if (frozen) {
      toast({
        title: "Updates Frozen",
        description: "Profile updates are frozen. Please contact an administrator if you need to make changes.",
        variant: "destructive",
      });
      return;
    }

    // Clean up the data before sending - convert empty strings to undefined/null
    const cleanedData: any = {};
    
    if (profileData.firstName?.trim()) cleanedData.firstName = profileData.firstName.trim();
    if (profileData.middleName?.trim()) cleanedData.middleName = profileData.middleName.trim();
    if (profileData.lastName?.trim()) cleanedData.lastName = profileData.lastName.trim();
    if (profileData.phone?.trim()) cleanedData.phone = profileData.phone.trim();
    if (profileData.teamName?.trim()) cleanedData.teamName = profileData.teamName.trim();
    if (user?.role === "user" && profileData.notes !== undefined) {
      cleanedData.notes = profileData.notes.trim();
    }
    
    // Only include nextOfKin if at least one required field is present
    if (profileData.nextOfKin.firstName?.trim() || profileData.nextOfKin.lastName?.trim() || profileData.nextOfKin.phone?.trim()) {
      cleanedData.nextOfKin = {
        firstName: profileData.nextOfKin.firstName?.trim() || undefined,
        middleName: profileData.nextOfKin.middleName?.trim() || undefined,
        lastName: profileData.nextOfKin.lastName?.trim() || undefined,
        phone: profileData.nextOfKin.phone?.trim() || undefined,
      };
    }
    
    updateProfileMutation.mutate(cleanedData);
  };

  const handleSaveSports = () => {
    // Prevent saving if frozen
    if (frozen) {
      toast({
        title: "Updates Frozen",
        description: "Sports selection updates are frozen. Please contact an administrator if you need to make changes.",
        variant: "destructive",
      });
      return;
    }

    const unavailableSelectedSport = selectedSports
      .map((sportId) => activeSports.find((sport: any) => sport.id === sportId))
      .find((sport) => sport && (getAgeRestrictionReason(sport) || getGenderRestrictionReason(sport)));
    if (unavailableSelectedSport) {
      const reason = getAgeRestrictionReason(unavailableSelectedSport) || getGenderRestrictionReason(unavailableSelectedSport);
      toast({
        title: "Sport Not Eligible",
        description: `${unavailableSelectedSport.name}: ${reason}`,
        variant: "destructive",
      });
      return;
    }

    updateSportsMutation.mutate(selectedSports);
  };

  const handleProfileChange = (field: string, value: any) => {
    // Prevent changes if frozen
    if (frozen) {
      return;
    }

    if (field.startsWith("nextOfKin.")) {
      const nextOfKinField = field.replace("nextOfKin.", "");
      setProfileData((prev) => ({
        ...prev,
        nextOfKin: {
          ...prev.nextOfKin,
          [nextOfKinField]: value,
        },
      }));
    } else {
      setProfileData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  if (!user) {
    return null;
  }

  // If user is a participant but hasn't registered yet
  if (user.role === "user" && !participantLoading && !participant) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="shadow-card">
              <CardHeader>
                <div className="inline-flex items-center justify-center p-3 bg-gradient-hero rounded-full mb-4 mx-auto">
                  <UserIcon className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Not Registered Yet</CardTitle>
                <CardDescription>
                  You need to register as a participant first to access your dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="lg" variant="hero" onClick={() => navigate("/register")}>
                  Register Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // If user is a volunteer but hasn't registered yet
  if (user.role === "volunteer" && !volunteerLoading && !volunteer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="shadow-card">
              <CardHeader>
                <div className="inline-flex items-center justify-center p-3 bg-gradient-hero rounded-full mb-4 mx-auto">
                  <UserIcon className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Volunteer Account</CardTitle>
                <CardDescription>
                  Your volunteer account is being set up. Please contact support if you need assistance.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const isInitialFetching =
    (user.role === "user" && (participantLoading || participantFetching)) ||
    (user.role === "volunteer" && (volunteerLoading || volunteerFetching)) ||
    sportsLoading ||
    sportsFetching;

  if (isInitialFetching) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const parentSports = activeSports.filter((s: any) => !s.parentId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">My Dashboard</h1>
            {participant && (
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Status:</Label>
                {getStatusBadge(participant.status || "pending")}
              </div>
            )}
            {volunteer && (
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Role:</Label>
                <Badge variant="secondary">Volunteer</Badge>
              </div>
            )}
          </div>
          <p className="text-muted-foreground">
            {user.role === "volunteer" ? "Manage your volunteer profile" : "Manage your profile and sports registration"}
          </p>
        </div>

        {participant &&
          user.role === "user" &&
          participant.status &&
          participant.status !== "accepted" && (
            <div className="mb-6 flex justify-center">
              <Card className="w-full max-w-md border-secondary/40 bg-secondary/10 text-center">
                <CardHeader className="space-y-3">
                  <div className="inline-flex items-center justify-center p-3 bg-gradient-hero rounded-full mx-auto">
                    <UserIcon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl">
                    {participant.status === "pending" ? "Application Pending" : "Application Under Review"}
                  </CardTitle>
                  <CardDescription className="flex flex-col items-center gap-2">
                    {getStatusBadge(participant.status)}
                    <span className="text-base text-foreground">
                      {participant.status === "pending"
                        ? "Your participant registration has been received and is awaiting approval from the administrators."
                        : "Your participant registration is not active. Please contact the administrators if you have questions about your status."}
                    </span>
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Edit Profile Details</TabsTrigger>
            {user.role === "user" && (
              <TabsTrigger value="sports">Edit Sports Selected</TabsTrigger>
            )}
            {user.role === "volunteer" && (
              <TabsTrigger value="assignments">Assigned Sports</TabsTrigger>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            {frozen && (
              <Card className="mb-4 border-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    <div>
                      <p className="font-semibold">Profile Updates Are Frozen</p>
                      <p className="text-sm text-muted-foreground">
                        Profile updates are no longer allowed after {freezeDate}. Please contact an administrator if you need to make changes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  {frozen 
                    ? "View your personal information and contact details. Editing is disabled due to freeze date."
                    : "Update your personal information and contact details."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => handleProfileChange("firstName", e.target.value)}
                      disabled={true}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      value={profileData.middleName}
                      onChange={(e) => handleProfileChange("middleName", e.target.value)}
                      disabled={true}
                      placeholder="Enter middle name (optional)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => handleProfileChange("lastName", e.target.value)}
                      disabled={true}
                      placeholder="Enter last name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange("phone", e.target.value)}
                      disabled={true}
                      placeholder="Enter phone number"
                    />
                  </div>
                {user.role === "user" && (
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Team Name</Label>
                    <Input
                      id="teamName"
                      value={profileData.teamName}
                      onChange={(e) => handleProfileChange("teamName", e.target.value)}
                      disabled={true}
                      placeholder="Enter team name (optional)"
                    />
                  </div>
                )}
                </div>

                {user.role === "user" && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Next of Kin</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nextOfKinFirstName">First Name *</Label>
                        <Input
                          id="nextOfKinFirstName"
                          value={profileData.nextOfKin.firstName}
                          onChange={(e) => handleProfileChange("nextOfKin.firstName", e.target.value)}
                          disabled={true}
                          placeholder="Enter first name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nextOfKinMiddleName">Middle Name</Label>
                        <Input
                          id="nextOfKinMiddleName"
                          value={profileData.nextOfKin.middleName}
                          onChange={(e) => handleProfileChange("nextOfKin.middleName", e.target.value)}
                          disabled={true}
                          placeholder="Enter middle name (optional)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nextOfKinLastName">Last Name *</Label>
                        <Input
                          id="nextOfKinLastName"
                          value={profileData.nextOfKin.lastName}
                          onChange={(e) => handleProfileChange("nextOfKin.lastName", e.target.value)}
                          disabled={true}
                          placeholder="Enter last name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nextOfKinPhone">Phone *</Label>
                        <Input
                          id="nextOfKinPhone"
                          value={profileData.nextOfKin.phone}
                          onChange={(e) => handleProfileChange("nextOfKin.phone", e.target.value)}
                          disabled={true}
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {user.role === "user" && (
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={profileData.notes}
                      onChange={(e) => handleProfileChange("notes", e.target.value)}
                      disabled={true}
                      placeholder="Share any additional information about your sports registration (injuries, preferences, availability, etc.)"
                      className="min-h-[100px]"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      This note is visible to community administrators reviewing your registration.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sports Tab */}
          {user.role === "user" && (
            <TabsContent value="sports">
              {frozen && (
                <Card className="mb-4 border-destructive">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-5 w-5" />
                      <div>
                        <p className="font-semibold">Sports Selection Updates Are Frozen</p>
                        <p className="text-sm text-muted-foreground">
                          Sports selection updates are no longer allowed after {freezeDate}. Please contact an administrator if you need to make changes.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Sports Selection</CardTitle>
                      <CardDescription>
                        {hasPendingSports
                          ? "Your updated sports will become active once approved by your community admin."
                          : frozen
                          ? "Your selected sports from registration. Editing is disabled due to freeze date."
                          : "Your selected sports from registration. Click Edit to change your selections."}
                      </CardDescription>
                    </div>
                    {!isEditingSports && !frozen && (
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingSports(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {hasPendingSports && (
                    <div className="mb-4 p-4 border border-secondary rounded-lg bg-secondary/10">
                      <p className="font-semibold text-primary">Sports Update Pending Approval</p>
                      <p className="text-sm text-muted-foreground">
                        You’ve requested changes to your sports. A community admin will review and approve the update shortly.
                      </p>
                    </div>
                  )}
                  {!isEditingSports ? (
                    // View mode - show selected sports
                    <div className="space-y-4">
                      {selectedSports.length > 0 ? (
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-semibold mb-2">Selected Sports ({selectedSports.length}):</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedSports.map((sportId) => {
                              const sport = activeSports.find((s: any) => s.id === sportId);
                              if (!sport) return null;
                              const parent = sport.parentId ? activeSports.find((s: any) => s.id === sport.parentId) : null;
                              const sportName = parent ? `${parent.name} - ${sport.name}` : sport.name;
                              return (
                                <span key={sportId} className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm">
                                  {sportName}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          No sports selected. Click Edit to select sports.
                        </div>
                      )}
                    </div>
                  ) : (
                    // Edit mode - show sports selection similar to registration
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {parentSports.map((parent: any) => {
                          const children = activeSports.filter((s: any) => s.parentId === parent.id);
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
                                        const selectedSport = activeSports.find((s: any) => s.id === selectedId);
                                        if (selectedSport) {
                                          const selectedIncompatibleIds = (selectedSport as any).incompatibleWith?.map((inc: any) => inc.incompatibleSportId) || [];
                                          if (selectedIncompatibleIds.includes(child.id)) {
                                            isIncompatibleFromSelected = true;
                                            break;
                                          }
                                        }
                                      }
                                      
                                      const isSelected = selectedSports.includes(child.id);
                                      const isUnavailable =
                                        Boolean(getAgeRestrictionReason(child) || getGenderRestrictionReason(child)) ||
                                        (selectedSports.length > 0 && (isIncompatibleWithSelected || isIncompatibleFromSelected) && !isSelected);
                                      const isDisabled = frozen || (isUnavailable && !isSelected);
                                      
                                      return (
                                        <div key={child.id} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`sport-${child.id}`}
                                            checked={isSelected}
                                            onCheckedChange={() => toggleSport(child.id)}
                                            disabled={isDisabled}
                                          />
                                          <Label 
                                            htmlFor={`sport-${child.id}`} 
                                            className={getSportLabelClass(isUnavailable, isDisabled)}
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
                                      const selectedSport = activeSports.find((s: any) => s.id === selectedId);
                                      if (selectedSport) {
                                        const selectedIncompatibleIds = (selectedSport as any).incompatibleWith?.map((inc: any) => inc.incompatibleSportId) || [];
                                        if (selectedIncompatibleIds.includes(parent.id)) {
                                          isIncompatibleFromSelected = true;
                                          break;
                                        }
                                      }
                                    }
                                    
                                    const isSelected = selectedSports.includes(parent.id);
                                    const isUnavailable =
                                      Boolean(getAgeRestrictionReason(parent) || getGenderRestrictionReason(parent)) ||
                                      (selectedSports.length > 0 && (isIncompatibleWithSelected || isIncompatibleFromSelected) && !isSelected);
                                    const isDisabled = frozen || (isUnavailable && !isSelected);
                                    
                                    return (
                                      <>
                                        <Checkbox
                                          id={`sport-${parent.id}`}
                                          checked={isSelected}
                                          onCheckedChange={() => toggleSport(parent.id)}
                                          disabled={isDisabled}
                                        />
                                        <Label 
                                          htmlFor={`sport-${parent.id}`} 
                                          className={getSportLabelClass(isUnavailable, isDisabled)}
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

                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const sportIds = participant?.sports
                              ? participant.sports.map((ps: any) => {
                                  if (typeof ps === 'string') {
                                    return ps;
                                  }
                                  return ps.sportId || ps.sport?.id || ps;
                                }).filter((sportId: string) => activeSportIds.has(sportId))
                              : [];
                            setSelectedSports(sportIds);
                            setIsEditingSports(false);
                          }}
                          disabled={updateSportsMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="hero"
                          onClick={handleSaveSports}
                          disabled={updateSportsMutation.isPending || frozen}
                        >
                          {updateSportsMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Volunteer Assignments */}
          {user.role === "volunteer" && (
            <TabsContent value="assignments">
              {frozen && (
                <Card className="mb-4 border-destructive">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-5 w-5" />
                      <div>
                        <p className="font-semibold">Sport Selection Updates Are Frozen</p>
                        <p className="text-sm text-muted-foreground">
                          Sport selection updates are no longer allowed after {freezeDate}. Please contact an administrator if you need to make changes.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Sports</CardTitle>
                  <CardDescription>
                    Sports where you have been assigned as a volunteer by the administrators.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {volunteer?.sports && volunteer.sports.length > 0 ? (
                    <div className="space-y-4">
                      {volunteer.sports.map((sport: any) => (
                        <div key={sport.id} className="border rounded-lg p-4 space-y-3">
                          <div>
                            <h3 className="text-xl font-semibold">{sport.name}</h3>
                            {sport.type && (
                              <p className="text-sm text-muted-foreground capitalize">
                                Type: {sport.type.toLowerCase().replace(/_/g, " ")}
                              </p>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                            {sport.venue && (
                              <div>
                                <span className="font-medium text-foreground">Venue:</span>{" "}
                                {sport.venue}
                              </div>
                            )}
                            {sport.timings && (
                              <div>
                                <span className="font-medium text-foreground">Timings:</span>{" "}
                                {sport.timings}
                              </div>
                            )}
                            {sport.date && (
                              <div>
                                <span className="font-medium text-foreground">Start Date:</span>{" "}
                                {new Date(sport.date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <p className="text-sm text-muted-foreground">
                        If you have any questions about your assignments, please contact the volunteer admin.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      You haven&apos;t been assigned to any sports yet. The volunteer admin will assign you soon.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
