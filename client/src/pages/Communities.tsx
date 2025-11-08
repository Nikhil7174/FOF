import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { Users, Phone, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Communities() {
  const { data: communities = [], isLoading } = useQuery({
    queryKey: ["communities"],
    queryFn: () => api.listCommunities(),
  });
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-hero rounded-full mb-4">
            <Users className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Community Contacts</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get in touch with representatives from each participating community
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))
          ) : communities.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No communities available yet.</p>
            </div>
          ) : (
            communities.map((community, index) => (
              <Card 
                key={community.id} 
                className="hover:shadow-card transition-all hover:scale-105 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: getColorForCommunity(community.name) }} />
                    <CardTitle className="text-lg">{community.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Contact Person</p>
                    <p className="font-medium">{community.contactPerson}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{community.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{community.email}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getColorForCommunity(community: string): string {
  const colors: Record<string, string> = {
    "Nairobi Central": "#FF6B35",
    "Westlands": "#17B8BE",
    "Karen": "#FFC43D",
    "Eastleigh": "#06FFA5",
    "South B": "#EE4266",
    "Lavington": "#8338EC",
  };
  return colors[community] || "#FF6B35";
}
