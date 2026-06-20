import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { useAuth } from "@/hooks/api/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { getSportCounts } from "@/utils/sportParticipantCounts";
import { SportRulesContent } from "@/components/SportRulesContent";
import { SportFormatContent, hasSportFormat } from "@/components/SportFormatContent";
import { BookOpen, LayoutGrid } from "lucide-react";

function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value?.trim() ? value : "—"} disabled className="bg-muted" />
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export function SportDetailView() {
  const { user } = useAuth();

  const { data: sport, isLoading: isLoadingSport } = useQuery({
    queryKey: ["sport", user?.sportId],
    queryFn: () => (user?.sportId ? api.getSport(user.sportId) : null),
    enabled: !!user?.sportId,
  });

  const { data: sports = [] } = useQuery({
    queryKey: ["sports"],
    queryFn: api.listSports,
    enabled: !!user?.sportId,
  });

  const { data: convenors = [] } = useQuery({
    queryKey: ["convenors"],
    queryFn: api.listConvenors,
    enabled: !!user?.sportId,
  });

  const { data: participantStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["participantStats"],
    queryFn: api.getParticipantStats,
    enabled: !!user?.sportId,
  });

  const sportCounts = useMemo(() => {
    if (!participantStats || !sport) {
      return { registered: 0, accepted: 0 };
    }
    const includeChildren = !sport.parentId;
    return getSportCounts(sport, sports, participantStats.bySportId, includeChildren);
  }, [participantStats, sport, sports]);

  const convenor = convenors.find((c) => c.sportId === sport?.id);

  if (isLoadingSport) {
    return <Skeleton className="h-64 w-full max-w-3xl mx-auto" />;
  }

  if (!sport) {
    return <div className="text-center text-muted-foreground">No sport assigned to your account.</div>;
  }

  const ageMin = sport.ageLimitMin ?? sport.ageLimit?.min;
  const ageMax = sport.ageLimitMax ?? sport.ageLimit?.max;
  const ageLabel =
    ageMin != null || ageMax != null ? `${ageMin ?? "?"} – ${ageMax ?? "?"}` : "Any";

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {isLoadingStats ? (
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium leading-snug min-h-[2.75rem]">
                Registered Participants
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold tabular-nums leading-none">{sportCounts.registered}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium leading-snug min-h-[2.75rem]">
                Accepted Participants
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold tabular-nums leading-none">{sportCounts.accepted}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{sport.name}</CardTitle>
          <CardDescription>View only — contact the super admin to update sport details, rules, or formats.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField label="Type" value={sport.type} />
            <ReadOnlyField label="Status" value={sport.active ? "Active" : "Inactive"} />
            <ReadOnlyField label="Gender" value={sport.gender || "Any"} />
            <ReadOnlyField label="Age Limit" value={ageLabel} />
            <ReadOnlyField label="Requires Team Name" value={sport.requiresTeamName ? "Yes" : "No"} />
            <ReadOnlyField label="Venue" value={sport.venue} />
            <ReadOnlyField label="Timings" value={sport.timings} />
            <ReadOnlyField label="Date" value={formatDate(sport.date)} />
          </div>

          {sport.notes?.trim() && (
            <div className="space-y-2">
              <Label>Notes</Label>
              <p className="text-sm text-muted-foreground rounded-md border bg-muted/30 p-3 whitespace-pre-wrap">
                {sport.notes}
              </p>
            </div>
          )}

          {convenor && (
            <div className="space-y-2 border-t pt-4">
              <Label className="text-base font-semibold">Convenor</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ReadOnlyField label="Name" value={convenor.name} />
                <ReadOnlyField label="Phone" value={convenor.phone} />
                <ReadOnlyField label="Email" value={convenor.email} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {(sport.rules?.trim() || sport.rulesFileUrl) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Sport Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SportRulesContent rules={sport.rules} rulesFileUrl={sport.rulesFileUrl} />
          </CardContent>
        </Card>
      )}

      {hasSportFormat(sport) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LayoutGrid className="h-5 w-5 text-primary" />
              Tournament Format
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SportFormatContent sport={sport} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
