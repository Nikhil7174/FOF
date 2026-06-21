import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CommunityRecord, Participant, ParticipantStats } from "@/types";

interface CommunityParticipantStatusOverviewProps {
  stats?: ParticipantStats;
  communities?: CommunityRecord[];
  participants?: Participant[];
  isLoading?: boolean;
}

export function CommunityParticipantStatusOverview({
  stats,
  communities = [],
  participants = [],
  isLoading = false,
}: CommunityParticipantStatusOverviewProps) {
  const rows = stats?.byCommunity?.length
    ? stats.byCommunity
    : communities.map((community) => {
        const communityParticipants = participants.filter((participant) => participant.communityId === community.id);
        return {
          communityId: community.id,
          communityName: community.name,
          total: communityParticipants.length,
          accepted: communityParticipants.filter((participant) => participant.status === "accepted").length,
          rejected: communityParticipants.filter((participant) => participant.status === "rejected").length,
          pending: communityParticipants.filter((participant) => participant.status === "pending").length,
        };
      });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entries by Community</CardTitle>
        <CardDescription>Total, accepted, rejected, and pending participant entries by community.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-6">Loading community entries...</p>
        ) : rows.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">No community entries found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Community</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Accepted</TableHead>
                <TableHead className="text-center">Rejected</TableHead>
                <TableHead className="text-center">Pending</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.communityId}>
                  <TableCell className="font-medium">{row.communityName}</TableCell>
                  <TableCell className="text-center tabular-nums">{row.total}</TableCell>
                  <TableCell className="text-center tabular-nums">{row.accepted}</TableCell>
                  <TableCell className="text-center tabular-nums">{row.rejected}</TableCell>
                  <TableCell className="text-center tabular-nums">{row.pending}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
