import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { sports } from "@/data/mockData";
import { Users } from "lucide-react";

export const SportsGrid = () => {
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
          {sports.map((sport, index) => {
            const percentage = (sport.participants / sport.maxParticipants) * 100;
            return (
              <Card key={sport.id} className="hover:shadow-card transition-shadow animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {sport.name}
                  </CardTitle>
                  <CardDescription>{sport.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Participants</span>
                      <span className="font-medium">
                        {sport.participants}/{sport.maxParticipants}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
