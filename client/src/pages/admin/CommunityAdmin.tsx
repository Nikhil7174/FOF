import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommunityDetailView } from "@/components/admin/CommunityDetailView";
import { CommunityParticipantsTable } from "@/components/admin/CommunityParticipantsTable";

export default function CommunityAdmin() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Community Admin Dashboard</h1>
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Community Details</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <CommunityDetailView />
          </TabsContent>

          <TabsContent value="participants">
            <CommunityParticipantsTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}



