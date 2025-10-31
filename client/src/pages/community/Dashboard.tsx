import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { useAuth } from "@/hooks/api/useAuth";

export default function CommunityDashboard() {
  const { user } = useAuth();
  const { data: participants = [] } = useQuery({ queryKey: ["participants"], queryFn: api.listParticipants });
  const mine = participants.filter((p: any) => p.communityId === user?.communityId);
  const totals = mine.reduce((acc: any, p: any) => { acc.total++; acc[p.status]++; return acc }, { total: 0, pending: 0, accepted: 0, rejected: 0 });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Community Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat title="Registered" value={totals.total} />
          <Stat title="Accepted" value={totals.accepted} />
          <Stat title="Pending" value={totals.pending} />
          <Stat title="Rejected" value={totals.rejected} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {mine.map((p: any) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span>{p.firstName} {p.lastName}</span>
                  <span className="uppercase text-muted-foreground">{p.status}</span>
                </li>
              ))}
              {mine.length === 0 && <div className="text-muted-foreground">No participants yet.</div>}
            </ul>
          </CardContent>
        </Card>
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


