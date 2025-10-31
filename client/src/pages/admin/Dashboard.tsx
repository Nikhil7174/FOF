import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";

export default function AdminDashboard() {
  const { data: participants = [] } = useQuery({ queryKey: ["participants"], queryFn: api.listParticipants });
  const { data: communities = [] } = useQuery({ queryKey: ["communities"], queryFn: api.listCommunities });

  const totals = participants.reduce((acc, p) => {
    acc.total++;
    acc[p.status]++;
    return acc;
  }, { total: 0, pending: 0, accepted: 0, rejected: 0 } as any);

  const byCommunity: Record<string, number> = {};
  for (const p of participants) byCommunity[p.communityId] = (byCommunity[p.communityId] || 0) + 1;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat title="Registered" value={totals.total} />
          <Stat title="Accepted" value={totals.accepted} />
          <Stat title="Pending" value={totals.pending} />
          <Stat title="Rejected" value={totals.rejected} />
        </div>

        <h2 className="text-xl font-semibold mb-3">By Community</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {communities.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="text-lg">{c.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{byCommunity[c.id] || 0}</div>
              </CardContent>
            </Card>
          ))}
        </div>
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


