import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SportDetailView } from "@/components/admin/SportDetailView";
import { SportParticipantsTable } from "@/components/admin/SportParticipantsTable";

export default function SportsAdmin() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Sports Admin Dashboard</h1>
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Sport Details</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <SportDetailView />
          </TabsContent>

          <TabsContent value="participants">
            <SportParticipantsTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}



