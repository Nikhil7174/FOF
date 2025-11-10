import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Trophy, User as UserIcon, Calendar, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/api/useAuth";
import { useNavigate } from "react-router-dom";

export default function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSports, setSelectedSports] = useState<string[]>([]);

  const { data: participant, isLoading: participantLoading } = useQuery({
    queryKey: ["myParticipant"],
    queryFn: api.getMyParticipant,
  });

  const { data: sports = [], isLoading: sportsLoading } = useQuery({
    queryKey: ["sports"],
    queryFn: api.listSports,
  });

  const { data: communities = [] } = useQuery({
    queryKey: ["communities"],
    queryFn: api.listCommunities,
  });

  // Initialize selected sports when participant data loads
  useEffect(() => {
    if (participant && participant.sports) {
      setSelectedSports(participant.sports);
    }
  }, [participant]);

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

  const handleSaveSports = () => {
    updateSportsMutation.mutate(selectedSports);
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

  const getSportName = (sportId: string) => {
    const sport = sports.find((s: any) => s.id === sportId);
    if (!sport) return sportId;
    // If it's a child sport, show parent - child format
    if (sport.parentId) {
      const parent = sports.find((s: any) => s.id === sport.parentId);
      return parent ? `${parent.name} - ${sport.name}` : sport.name;
    }
    return sport.name;
  };

  const communityName = participant
    ? communities.find((c) => c.id === participant.communityId)?.name || "Unknown"
    : "";

  if (!user) {
    return null;
  }

  // If user hasn't registered as a participant yet
  if (!participantLoading && !participant) {
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

  if (participantLoading || sportsLoading) {
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
  const registeredSports = participant?.sports || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">Manage your sports registration and view your status</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="font-medium">
                  {participant?.firstName} {participant?.middleName} {participant?.lastName}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-medium">{participant?.email}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <p className="font-medium">{participant?.phone}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Community</Label>
                <p className="font-medium">{communityName}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Registration Status</Label>
                <div className="mt-1">{getStatusBadge(participant?.status || "pending")}</div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Registered Sports</Label>
                <p className="text-2xl font-bold">{registeredSports.length}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Registration Date</Label>
                <p className="font-medium">
                  {participant?.createdAt
                    ? new Date(participant.createdAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Current Sports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Current Sports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {registeredSports.length > 0 ? (
                <div className="space-y-2">
                  {registeredSports.map((sportId) => (
                    <Badge key={sportId} variant="outline" className="mr-2 mb-2">
                      {getSportName(sportId)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No sports registered yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sports Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Update Sports Registration</CardTitle>
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
                  onClick={() => setSelectedSports(registeredSports)}
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
      </div>
    </div>
  );
}

