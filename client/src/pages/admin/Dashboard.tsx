import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { SportManagement } from "@/components/admin/SportManagement";
import { CommunityManagement } from "@/components/admin/CommunityManagement";
import { UserManagement } from "@/components/admin/UserManagement";
import { VolunteerManagement } from "@/components/admin/VolunteerManagement";
import { CalendarManagement } from "@/components/admin/CalendarManagement";
import { TournamentFormatsManagement } from "@/components/admin/TournamentFormatsManagement";
import { SettingsManagement } from "@/components/admin/SettingsManagement";
import { TermsManagement } from "@/components/admin/TermsManagement";
import { useAuth } from "@/hooks/api/useAuth";

export default function AdminDashboard() {
  const { user } = useAuth();
  
  const { data: volunteers = [], isLoading: isLoadingVolunteers } = useQuery({ 
    queryKey: ["volunteers"], 
    queryFn: () => api.listVolunteers(),
    enabled: !!user,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });
  
  const { data: sports = [], isLoading: isLoadingSports } = useQuery({ 
    queryKey: ["sports"], 
    queryFn: api.listSports,
    enabled: !!user,
    retry: 2,
  });
  
  const { data: communities = [], isLoading: isLoadingCommunities } = useQuery({ 
    queryKey: ["communities"], 
    queryFn: api.listCommunities,
    enabled: !!user,
    retry: 2,
  });

  const { data: participantStats, isLoading: isLoadingParticipantStats } = useQuery({
    queryKey: ["participantStats"],
    queryFn: api.getParticipantStats,
    enabled: !!user,
    retry: 2,
  });

  const isLoading =
    isLoadingVolunteers ||
    isLoadingSports ||
    isLoadingCommunities ||
    isLoadingParticipantStats;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <Tabs defaultValue="overview" orientation="vertical" className="flex flex-col md:flex-row gap-6">
          <TabsList className="flex flex-col gap-2 w-full md:w-64 bg-muted/40 p-2 rounded-lg h-fit">
            <TabsTrigger value="overview" className="justify-start">Overview</TabsTrigger>
            <TabsTrigger value="sports" className="justify-start">Sports</TabsTrigger>
            <TabsTrigger value="communities" className="justify-start">Communities</TabsTrigger>
            <TabsTrigger value="users" className="justify-start">Participants</TabsTrigger>
            <TabsTrigger value="volunteers" className="justify-start">Volunteers</TabsTrigger>
            <TabsTrigger value="calendar" className="justify-start">Calendar</TabsTrigger>
            <TabsTrigger value="formats" className="justify-start">Tournament Formats</TabsTrigger>
            <TabsTrigger value="terms" className="justify-start">Terms &amp; Conditions</TabsTrigger>
            <TabsTrigger value="settings" className="justify-start">Settings</TabsTrigger>
          </TabsList>

          <div className="flex-1 space-y-6">
            <TabsContent value="overview" className="space-y-4">
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <Stat title="Registered Participants" value={participantStats?.totalRegistered ?? 0} />
                  <Stat title="Accepted Participants" value={participantStats?.totalAccepted ?? 0} />
                  <Stat title="Volunteers" value={volunteers.length} />
                  <Stat title="Sports" value={sports.length} />
                  <Stat title="Communities" value={communities.length} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="sports">
              <SportManagement />
            </TabsContent>

            <TabsContent value="communities">
              <CommunityManagement />
            </TabsContent>

            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            <TabsContent value="volunteers">
              <VolunteerManagement />
            </TabsContent>

            <TabsContent value="calendar">
              <CalendarManagement />
            </TabsContent>

            <TabsContent value="formats">
              <TournamentFormatsManagement />
            </TabsContent>

            <TabsContent value="terms">
              <TermsManagement />
            </TabsContent>

            <TabsContent value="settings">
              <SettingsManagement />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium leading-snug min-h-[2.75rem]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-3xl font-bold tabular-nums leading-none">{value}</div>
      </CardContent>
    </Card>
  );
}


