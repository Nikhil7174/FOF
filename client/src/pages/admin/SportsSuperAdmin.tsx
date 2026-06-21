import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { SportManagement } from "@/components/admin/SportManagement";
import { CalendarManagement } from "@/components/admin/CalendarManagement";
import { TournamentFormatsManagement } from "@/components/admin/TournamentFormatsManagement";
import { SportParticipantsTable } from "@/components/admin/SportParticipantsTable";
import { CommunityParticipantStatusOverview } from "@/components/admin/CommunityParticipantStatusOverview";
import { useAuth } from "@/hooks/api/useAuth";
import { countParentSports } from "@/utils/sportParticipantCounts";

export default function SportsSuperAdmin() {
  const { user } = useAuth();

  const { data: sports = [], isLoading: isLoadingSports } = useQuery({
    queryKey: ["sports"],
    queryFn: () => api.listSports(),
    enabled: !!user,
  });

  const { data: participantStats, isLoading: isLoadingParticipantStats } = useQuery({
    queryKey: ["participantStats"],
    queryFn: api.getParticipantStats,
    enabled: !!user,
  });

  const { data: communities = [], isLoading: isLoadingCommunities } = useQuery({
    queryKey: ["communities"],
    queryFn: api.listCommunities,
    enabled: !!user,
  });

  const { data: participants = [], isLoading: isLoadingParticipants } = useQuery({
    queryKey: ["participants"],
    queryFn: api.listParticipants,
    enabled: !!user,
  });

  const isLoading = isLoadingSports || isLoadingParticipantStats || isLoadingCommunities || isLoadingParticipants;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Sports Super Admin Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          Manage all sports, rules, formats, and calendar events across the festival.
        </p>

        <Tabs defaultValue="overview" orientation="vertical" className="flex flex-col md:flex-row gap-6">
          <TabsList className="flex flex-col gap-2 w-full md:w-64 bg-muted/40 p-2 rounded-lg h-fit">
            <TabsTrigger value="overview" className="justify-start">Overview</TabsTrigger>
            <TabsTrigger value="sports" className="justify-start">Sports</TabsTrigger>
            <TabsTrigger value="calendar" className="justify-start">Calendar</TabsTrigger>
            <TabsTrigger value="formats" className="justify-start">Tournament Formats</TabsTrigger>
            <TabsTrigger value="participants" className="justify-start">Participants</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-w-0 space-y-6">
            <TabsContent value="overview" className="space-y-4 min-w-0">
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Stat title="Sports" value={countParentSports(sports)} />
                  <Stat title="Registered Participants" value={participantStats?.totalRegistered ?? 0} />
                  <Stat title="Accepted Participants" value={participantStats?.totalAccepted ?? 0} />
                </div>
              )}
              <CommunityParticipantStatusOverview
                stats={participantStats}
                communities={communities}
                participants={participants}
                isLoading={isLoadingCommunities || isLoadingParticipants || isLoadingParticipantStats}
              />
            </TabsContent>

            <TabsContent value="sports">
              <SportManagement />
            </TabsContent>

            <TabsContent value="calendar">
              <CalendarManagement />
            </TabsContent>

            <TabsContent value="formats">
              <TournamentFormatsManagement />
            </TabsContent>

            <TabsContent value="participants">
              <SportParticipantsTable />
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
