import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportButton } from "@/components/ui/export-button";

function ParticipantStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-2 py-1 rounded text-xs capitalize ${
        status === "accepted"
          ? "bg-green-100 text-green-800"
          : status === "pending"
          ? "bg-yellow-100 text-yellow-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {status}
    </span>
  );
}

export function SportParticipantsTable() {
  const { data: participants = [], isLoading: isLoadingParticipants } = useQuery({
    queryKey: ["participants"],
    queryFn: api.listParticipants,
  });

  const { data: communities = [], isLoading: isLoadingCommunities } = useQuery({
    queryKey: ["communities"],
    queryFn: api.listCommunities,
  });

  const sportParticipants = participants;
  const isLoading = isLoadingParticipants || isLoadingCommunities;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Participants ({sportParticipants.length})</CardTitle>
          <ExportButton
            onExportCSV={() => api.exportParticipants("csv")}
            onExportExcel={() => api.exportParticipants("excel")}
            disabled={isLoading}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Community</TableHead>
                <TableHead>Team Name</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : sportParticipants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No participants registered for this sport yet.
                  </TableCell>
                </TableRow>
              ) : (
                sportParticipants.map((p: any) => {
                  const comm = communities.find((c: any) => c.id === p.communityId);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.firstName} {p.middleName ? p.middleName + " " : ""}{p.lastName}
                      </TableCell>
                      <TableCell>{p.email}</TableCell>
                      <TableCell>{p.phone}</TableCell>
                      <TableCell>{comm?.name || "-"}</TableCell>
                      <TableCell>
                        {(() => {
                          const teamNamesObj = (p.teamNames as Record<string, string> | null) || {};
                          // Find team name for any sport this participant has (show all, since sports admin sees their sport's participants)
                          const teamNameEntries = Object.entries(teamNamesObj);
                          if (teamNameEntries.length > 0) {
                            return teamNameEntries.map(([, name]) => name).join(", ");
                          }
                          return p.teamName || "-";
                        })()}
                      </TableCell>
                      <TableCell>
                        <ParticipantStatusBadge status={p.status} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
