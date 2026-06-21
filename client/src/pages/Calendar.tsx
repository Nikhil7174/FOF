import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarGridView } from "@/components/CalendarGridView";

export default function Calendar() {
  const { data: calendarGrid = [], isLoading: isLoadingCalendarGrid } = useQuery({
    queryKey: ["calendar-grid"],
    queryFn: api.listCalendarGrid,
  });

  const { data: calendarEvents = [], isLoading: isLoadingCalendar } = useQuery({
    queryKey: ["calendar"],
    queryFn: () => api.listCalendar(),
    enabled: calendarGrid.length === 0,
  });

  const { data: sports = [] } = useQuery({
    queryKey: ["sports"],
    queryFn: () => api.listSports(),
    enabled: calendarGrid.length === 0,
  });
  const activeSports = sports.filter((sport) => sport.active !== false);

  const getSportName = (sportId: string) => {
    const sport = activeSports.find((s) => s.id === sportId);
    if (!sport) return `Sport ${sportId}`;
    if (sport.parentId) {
      const parent = activeSports.find((s) => s.id === sport.parentId);
      return parent ? `${parent.name} - ${sport.name}` : sport.name;
    }
    return sport.name;
  };

  const sportMap = new Map(activeSports.map((s) => [s.id, getSportName(s.id)]));

  const visibleCalendarEvents = calendarEvents.filter((event) => sportMap.has(event.sportId));
  const groupedEvents = visibleCalendarEvents.reduce((acc, event) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, typeof visibleCalendarEvents>);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isLoading = isLoadingCalendarGrid || (calendarGrid.length === 0 && isLoadingCalendar);

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

        <div className="max-w-6xl mx-auto space-y-8">
          {isLoading ? (
            <Skeleton className="h-[720px] w-full rounded-lg" />
          ) : calendarGrid.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  FOF Sports Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarGridView entries={calendarGrid} />
              </CardContent>
            </Card>
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
