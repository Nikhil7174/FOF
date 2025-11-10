import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trophy, Users, Calendar } from "lucide-react";
import heroImage from "@/assets/hero-sports.jpg";
import { useAuth } from "@/hooks/api/useAuth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { useMemo } from "react";

export const Hero = () => {
  const { user } = useAuth();
  
  // Fetch sports count
  const { data: sports = [] } = useQuery({
    queryKey: ["sports"],
    queryFn: api.listSports,
  });

  // Fetch communities count
  const { data: communities = [] } = useQuery({
    queryKey: ["communities"],
    queryFn: api.listCommunities,
  });

  // Fetch calendar events to get the earliest date
  const { data: calendarEvents = [] } = useQuery({
    queryKey: ["calendar"],
    queryFn: api.listCalendar,
  });

  // Calculate days until the earliest event and get the start date
  const { daysUntilEvent, startDate } = useMemo(() => {
    if (!calendarEvents || calendarEvents.length === 0) {
      return { daysUntilEvent: null, startDate: null };
    }

    // Find the earliest event date
    const dates = calendarEvents
      .map((event) => new Date(event.date))
      .filter((date) => !isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) {
      return { daysUntilEvent: null, startDate: null };
    }

    const earliestDate = dates[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    earliestDate.setHours(0, 0, 0, 0);

    const diffTime = earliestDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      daysUntilEvent: diffDays >= 0 ? diffDays : 0,
      startDate: earliestDate,
    };
  }, [calendarEvents]);

  // Count only parent sports (exclude sub-categories) that are active
  const activeSportsCount = sports.filter((s: any) => !s.parentId && s.active !== false).length;
  
  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="max-w-2xl animate-fade-in">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Welcome to{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              FOF 2026
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-semibold">
            A Festival Of Friendship
          </p>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl">
            Where different communities participate and compete in various sports and events. 
            Join us in celebrating unity, sportsmanship, and community spirit.
          </p>

          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button size="lg" variant="hero" asChild>
                <Link to="/register">Register Now</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/volunteer">Volunteer Sign-Up</Link>
              </Button>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg">
            <div className="bg-card/50 backdrop-blur p-4 rounded-lg border border-border animate-slide-in">
              <Trophy className="h-8 w-8 text-primary mb-2" />
              <div className="text-2xl font-bold">{activeSportsCount}</div>
              <div className="text-xs text-muted-foreground">Sports</div>
            </div>
            <div className="bg-card/50 backdrop-blur p-4 rounded-lg border border-border animate-slide-in" style={{ animationDelay: "0.1s" }}>
              <Users className="h-8 w-8 text-secondary mb-2" />
              <div className="text-2xl font-bold">{communities.length}</div>
              <div className="text-xs text-muted-foreground">Communities</div>
            </div>
            <div className="bg-card/50 backdrop-blur p-4 rounded-lg border border-border animate-slide-in" style={{ animationDelay: "0.2s" }}>
              <Calendar className="h-8 w-8 text-accent mb-2" />
              {startDate ? (
                <>
                  <div className="text-lg font-bold">
                    {startDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {daysUntilEvent !== null && daysUntilEvent > 0
                      ? `${daysUntilEvent} Days Until Start`
                      : daysUntilEvent === 0
                      ? "Starts Today"
                      : "Event Date"}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">-</div>
                  <div className="text-xs text-muted-foreground">Days Until Start</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
