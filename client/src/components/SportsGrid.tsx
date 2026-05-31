import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { SportRecord } from "@/types";
import { useMemo } from "react";
import { getSportCounts } from "@/utils/sportParticipantCounts";

export const SportsGrid = () => {
  const { data: sports = [], isLoading: sportsLoading } = useQuery({
    queryKey: ["sports"],
    queryFn: () => api.listSports(),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["participantStats"],
    queryFn: () => api.getParticipantStats(),
  });

  const isLoading = sportsLoading || statsLoading;
  const topLevelSports = useMemo(
    () => sports.filter((sport) => !sport.parentId && sport.active),
    [sports]
  );

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Available Sports</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose from a variety of sports and register for your favorites
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-10">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-10">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Registered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalRegistered}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalAccepted}</div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))
          ) : topLevelSports.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No sports available yet.</p>
            </div>
          ) : (
            topLevelSports.map((sport, index) => {
              const counts = stats
                ? getSportCounts(sport, sports, stats.bySportId)
                : { registered: 0, accepted: 0 };

              return (
                <Card
                  key={sport.id}
                  className="hover:shadow-card transition-shadow animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      {sport.name}
                    </CardTitle>
                    <CardDescription>{sport.type === "team" ? "Team Sport" : "Individual Sport"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Registered</span>
                        <span className="font-medium">{counts.registered}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Accepted</span>
                        <span className="font-medium">{counts.accepted}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
