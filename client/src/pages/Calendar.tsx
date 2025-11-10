import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Calendar() {
  const { data: calendarEvents = [], isLoading: isLoadingCalendar } = useQuery({
    queryKey: ["calendar"],
    queryFn: () => api.listCalendar(),
  });

  const { data: sports = [] } = useQuery({
    queryKey: ["sports"],
    queryFn: () => api.listSports(),
  });

  // Helper function to get sport name with parent category for sub-categories
  const getSportName = (sportId: string) => {
    const sport = sports.find((s) => s.id === sportId);
    if (!sport) return `Sport ${sportId}`;
    // If it's a child sport, show parent - child format
    if (sport.parentId) {
      const parent = sports.find((s) => s.id === sport.parentId);
      return parent ? `${parent.name} - ${sport.name}` : sport.name;
    }
    return sport.name;
  };

  // Create a map of sportId to sport name (with parent for sub-categories)
  const sportMap = new Map(sports.map((s) => [s.id, getSportName(s.id)]));

  // Group events by date
  const groupedEvents = calendarEvents.reduce((acc, event) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, typeof calendarEvents>);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-hero rounded-full mb-4">
            <CalendarIcon className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Sports Calendar</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            View the complete schedule of all sports events during FOF 2026
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-8">
          {isLoadingCalendar ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            </div>
          ) : Object.keys(groupedEvents).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No calendar events available yet.</p>
            </div>
          ) : (
            Object.entries(groupedEvents).map(([date, events], dateIndex) => (
              <div key={date} className="animate-fade-in" style={{ animationDelay: `${dateIndex * 0.1}s` }}>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                  {formatDate(date)}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map((event) => {
                    const sportName = sportMap.get(event.sportId) || `Sport ${event.sportId}`;
                    return (
                      <Card key={event.id} className="hover:shadow-card transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-xl">{sportName}</CardTitle>
                            <Badge variant={event.type === "Finals" ? "default" : "secondary"}>
                              {event.type}
                            </Badge>
                          </div>
                          <CardDescription className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {event.time}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {event.venue}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
