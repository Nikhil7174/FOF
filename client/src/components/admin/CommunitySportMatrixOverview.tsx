import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportButton } from "@/components/ui/export-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { useAuth } from "@/hooks/api/useAuth";

type MatrixStatus = "accepted" | "pending" | "rejected" | "all";

export function CommunitySportMatrixOverview() {
  const { user } = useAuth();
  const [status, setStatus] = useState<MatrixStatus>("accepted");

  const { data: matrix, isLoading, isError, error } = useQuery({
    queryKey: ["communitySportMatrix", status],
    queryFn: () => api.getCommunitySportMatrix(status === "all" ? "all" : status),
    enabled: user?.role === "admin",
    retry: 1,
  });

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              Community vs Sport
            </CardTitle>
            <CardDescription className="mt-1">
              All communities and sports from the database. Empty cells mean no registrations for that filter.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Select value={status} onValueChange={(value) => setStatus(value as MatrixStatus)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accepted">Accepted only</SelectItem>
                <SelectItem value="pending">Pending only</SelectItem>
                <SelectItem value="rejected">Rejected only</SelectItem>
                <SelectItem value="all">All registrations</SelectItem>
              </SelectContent>
            </Select>
            <ExportButton
              disabled={isLoading || isError || !matrix?.rows.length}
              onExportCSV={() => api.exportCommunitySportMatrix("csv", status === "all" ? "all" : status)}
              onExportExcel={() => api.exportCommunitySportMatrix("excel", status === "all" ? "all" : status)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-w-0">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : isError ? (
          <p className="text-sm text-destructive text-center py-8">
            Failed to load matrix: {(error as Error)?.message || "Unknown error"}. Try restarting the API server.
          </p>
        ) : !matrix || (matrix.rows.length === 0 && matrix.sports.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No communities or sports found in the database yet.
          </p>
        ) : (
          <div className="w-full max-w-full overflow-hidden rounded-lg border bg-background">
            <div className="overflow-x-auto overflow-y-auto max-h-[min(800px,calc(100vh-16rem))]">
              <table className="w-max min-w-full text-sm border-collapse">
                <thead className="sticky top-0 z-20 bg-cyan-100">
                  <tr>
                    <th className="sticky left-0 z-30 bg-cyan-100 border-b border-r px-3 py-3 text-left font-semibold min-w-[200px] max-w-[240px]">
                      Community
                    </th>
                    {matrix.sports.map((sport) => (
                      <th
                        key={sport.id}
                        className="border-b border-r px-1 py-2 text-center font-semibold w-10 min-w-[40px]"
                      >
                        <span
                          className="inline-block max-h-28 overflow-hidden [writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-[10px] leading-tight"
                          title={sport.name}
                        >
                          {sport.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.rows.map((row) => (
                    <tr key={row.communityId} className="hover:bg-muted/30">
                      <td
                        className="sticky left-0 z-10 bg-background border-b border-r px-3 py-2 font-medium whitespace-nowrap min-w-[200px] max-w-[240px] truncate"
                        title={row.communityName}
                      >
                        {row.communityName}
                      </td>
                      {matrix.sports.map((sport) => {
                        const count = row.counts[sport.id] ?? 0;
                        return (
                          <td
                            key={sport.id}
                            className="border-b border-r px-1 py-2 text-center tabular-nums text-muted-foreground w-10 min-w-[40px]"
                          >
                            {count > 0 ? count : ""}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
