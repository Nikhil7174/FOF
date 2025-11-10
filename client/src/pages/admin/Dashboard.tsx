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
import { useAuth } from "@/hooks/api/useAuth";

export default function AdminDashboard() {
  const { user } = useAuth(); // Add this to check auth status
  
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({ 
    queryKey: ["users"], 
    queryFn: api.listUsers,
    enabled: !!user, // Only fetch when user is authenticated
    retry: 2, // Retry failed requests
  });
  
  const { data: volunteers = [], isLoading: isLoadingVolunteers } = useQuery({ 
    queryKey: ["volunteers"], 
    queryFn: () => api.listVolunteers(),
    enabled: !!user, // Only fetch when user is authenticated
    retry: 2, // Retry failed requests
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
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

  const isLoading = isLoadingUsers || isLoadingVolunteers || isLoadingSports || isLoadingCommunities;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sports">Sports</TabsTrigger>
            <TabsTrigger value="communities">Communities</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="formats">Tournament Formats</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat title="Users" value={users.length} />
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

          <TabsContent value="calendar">
            <CalendarManagement />
          </TabsContent>

          <TabsContent value="formats">
            <TournamentFormatsManagement />
          </TabsContent>

          <TabsContent value="volunteers">
            <VolunteerManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}


