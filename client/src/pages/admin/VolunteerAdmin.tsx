import { Navbar } from "@/components/Navbar";
import { VolunteerManagement } from "@/components/admin/VolunteerManagement";

export default function VolunteerAdmin() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Volunteer Admin</h1>
        <VolunteerManagement />
      </div>
    </div>
  );
}



