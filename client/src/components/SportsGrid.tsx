import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const SportsGrid = () => {
  const { data: sports = [], isLoading } = useQuery({
    queryKey: ["sports"],
    queryFn: () => api.listSports(),
  });
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Available Sports</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose from a variety of sports and register for your favorites
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))
          ) : sports.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No sports available yet.</p>
            </div>
          ) : (
            sports
              .filter((sport) => !sport.parentId && sport.active) // Only show top-level active sports
              .map((sport, index) => (
                <Card key={sport.id} className="hover:shadow-card transition-shadow animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
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
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium">
                          {sport.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>
    </section>
  );
};
