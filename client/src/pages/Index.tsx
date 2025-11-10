import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { SportsGrid } from "@/components/SportsGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Trophy, Users, Heart } from "lucide-react";
import { useAuth } from "@/hooks/api/useAuth";

const Index = () => {
  const { user } = useAuth();
  const quickLinks = [
    {
      title: "Sports Calendar",
      description: "View the complete event schedule",
      icon: Calendar,
      link: "/calendar",
      color: "text-primary",
    },
    {
      title: "Sports Info",
      description: "Rules, formats, and convenors",
      icon: Trophy,
      link: "/sports",
      color: "text-secondary",
    },
    {
      title: "Communities",
      description: "Connect with community representatives",
      icon: Users,
      link: "/communities",
      color: "text-accent",
    },
    {
      title: "Volunteer",
      description: "Join our team of volunteers for FOF 2026",
      icon: Heart,
      link: "/volunteer",
      color: "text-destructive",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <SportsGrid />
      
      {/* Quick Links Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Quick Access</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need for FOF 2026 in one place
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {quickLinks.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card 
                  key={item.title} 
                  className="hover:shadow-card transition-all hover:scale-105 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader>
                    <Icon className={`h-8 w-8 ${item.color} mb-2`} />
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{item.description}</p>
                    <Button variant="outline" asChild className="w-full">
                      <Link to={item.link}>Learn More</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Join FOF 2026?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Register now and be part of this amazing celebration of friendship, sports, and community
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="hero" asChild>
                <Link to="/register">Register as Participant</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/volunteer">Volunteer with Us</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
