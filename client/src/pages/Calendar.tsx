import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calendarEvents } from "@/data/mockData";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";

export default function Calendar() {
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
          {Object.entries(groupedEvents).map(([date, events], dateIndex) => (
            <div key={date} className="animate-fade-in" style={{ animationDelay: `${dateIndex * 0.1}s` }}>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-primary" />
                {formatDate(date)}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((event) => (
                  <Card key={event.id} className="hover:shadow-card transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl">{event.sport}</CardTitle>
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
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
