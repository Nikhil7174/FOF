import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { User as UserIcon, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/api/useAuth";
import { useNavigate } from "react-router-dom";
import type { Participant, SportRecord, VolunteerEntry } from "@/types";

export default function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  
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
  });

  type VolunteerWithSport = VolunteerEntry & { sport?: SportRecord | null };

  const { data: participant, isLoading: participantLoading } = useQuery<Participant | null>({
    queryKey: ["myParticipant"],
    queryFn: api.getMyParticipant,
    enabled: user?.role === "user",
  });

  const { data: volunteer, isLoading: volunteerLoading } = useQuery<VolunteerWithSport | null>({
    queryKey: ["myVolunteer"],
    queryFn: api.getMyVolunteer,
    enabled: user?.role === "volunteer",
  });

  const { data: sports = [], isLoading: sportsLoading } = useQuery({
    queryKey: ["sports"],
    queryFn: api.listSports,
  });

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
        });
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
      });
    }
  }, [participant, volunteer]);

  const updateProfileMutation = useMutation({
    mutationFn: api.updateParticipantProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myParticipant"] });
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
    setSelectedSports((prev) =>
      prev.includes(sportId) ? prev.filter((id) => id !== sportId) : [...prev, sportId]
    );
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleSaveSports = () => {
    updateSportsMutation.mutate(selectedSports);
  };

  const handleProfileChange = (field: string, value: any) => {
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

  if ((user.role === "user" && participantLoading) || (user.role === "volunteer" && volunteerLoading) || sportsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const parentSports = sports.filter((s: any) => !s.parentId);

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
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and contact details.
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
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      value={profileData.middleName}
                      onChange={(e) => handleProfileChange("middleName", e.target.value)}
                      placeholder="Enter middle name (optional)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => handleProfileChange("lastName", e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange("phone", e.target.value)}
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
                          placeholder="Enter first name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nextOfKinMiddleName">Middle Name</Label>
                        <Input
                          id="nextOfKinMiddleName"
                          value={profileData.nextOfKin.middleName}
                          onChange={(e) => handleProfileChange("nextOfKin.middleName", e.target.value)}
                          placeholder="Enter middle name (optional)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nextOfKinLastName">Last Name *</Label>
                        <Input
                          id="nextOfKinLastName"
                          value={profileData.nextOfKin.lastName}
                          onChange={(e) => handleProfileChange("nextOfKin.lastName", e.target.value)}
                          placeholder="Enter last name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nextOfKinPhone">Phone *</Label>
                        <Input
                          id="nextOfKinPhone"
                          value={profileData.nextOfKin.phone}
                          onChange={(e) => handleProfileChange("nextOfKin.phone", e.target.value)}
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="hero"
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sports Tab */}
          {user.role === "user" && (
            <TabsContent value="sports">
              <Card>
                <CardHeader>
                  <CardTitle>Sports Selection</CardTitle>
                  <CardDescription>
                    Select the sports you want to participate in. You can update your selections at any time.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {parentSports.map((parent: any) => {
                        const children = sports.filter((s: any) => s.parentId === parent.id);
                        return (
                          <div key={parent.id} className="space-y-2 border rounded-lg p-4">
                            <div className="font-semibold text-lg">{parent.name}</div>
                            {children.length > 0 ? (
                              <div className="ml-4 space-y-2">
                                {children.map((child: any) => (
                                  <div key={child.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`sport-${child.id}`}
                                      checked={selectedSports.includes(child.id)}
                                      onCheckedChange={() => toggleSport(child.id)}
                                    />
                                    <Label
                                      htmlFor={`sport-${child.id}`}
                                      className="text-sm font-normal cursor-pointer"
                                    >
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
                                <Label
                                  htmlFor={`sport-${parent.id}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {parent.name}
                                </Label>
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
                              })
                            : [];
                          setSelectedSports(sportIds);
                        }}
                        disabled={updateSportsMutation.isPending}
                      >
                        Reset
                      </Button>
                      <Button
                        variant="hero"
                        onClick={handleSaveSports}
                        disabled={updateSportsMutation.isPending}
                      >
                        {updateSportsMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Volunteer Assignments */}
          {user.role === "volunteer" && (
            <TabsContent value="assignments">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Sports</CardTitle>
                  <CardDescription>
                    Sports where you have been assigned as a volunteer by the administrators.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {volunteer?.sport ? (
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4 space-y-3">
                        <div>
                          <h3 className="text-xl font-semibold">{volunteer.sport.name}</h3>
                          {volunteer.sport.type && (
                            <p className="text-sm text-muted-foreground capitalize">
                              Type: {volunteer.sport.type.toLowerCase().replace(/_/g, " ")}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                          {volunteer.sport.venue && (
                            <div>
                              <span className="font-medium text-foreground">Venue:</span>{" "}
                              {volunteer.sport.venue}
                            </div>
                          )}
                          {volunteer.sport.timings && (
                            <div>
                              <span className="font-medium text-foreground">Timings:</span>{" "}
                              {volunteer.sport.timings}
                            </div>
                          )}
                          {volunteer.sport.date && (
                            <div>
                              <span className="font-medium text-foreground">Start Date:</span>{" "}
                              {new Date(volunteer.sport.date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          If you have any questions about your assignment, please contact the volunteer admin.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
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
