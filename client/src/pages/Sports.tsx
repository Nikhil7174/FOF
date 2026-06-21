import { Navbar } from "@/components/Navbar";
import { SportRulesContent } from "@/components/SportRulesContent";
import { SportFormatContent, hasSportFormat } from "@/components/SportFormatContent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Phone, Mail, BookOpen, LayoutGrid } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function Sports() {
  const { data: convenors = [], isLoading: isLoadingConvenors } = useQuery({
    queryKey: ["convenors"],
    queryFn: api.listConvenors,
  });

  const { data: sports = [], isLoading: isLoadingSports } = useQuery({
    queryKey: ["sports"],
    queryFn: api.listSports,
  });

  const activeSports = sports.filter((sport) => sport.active !== false);
  const activeConvenors = convenors.filter((convenor) => convenor.sport?.active !== false);
  const sportsWithRules = activeSports.filter((s) => s.rules?.trim() || s.rulesFileUrl);
  const sportsWithFormats = activeSports.filter((s) => hasSportFormat(s));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-hero rounded-full mb-4">
            <Trophy className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Sports Information</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about sports, rules, and convenors
          </p>
        </div>

        <Tabs defaultValue="convenors" className="max-w-5xl mx-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="convenors">Convenors</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="formats">Formats</TabsTrigger>
          </TabsList>

          <TabsContent value="convenors" className="mt-6">
            {isLoadingConvenors ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-24 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-40 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : activeConvenors.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No convenors found.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeConvenors.map((convenor, index) => (
                  <Card key={convenor.id} className="hover:shadow-card transition-shadow animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        {convenor.name}
                      </CardTitle>
                      <CardDescription>{convenor.sport?.name || "No sport assigned"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{convenor.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{convenor.email}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rules" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Sports Rules
                </CardTitle>
                <CardDescription>Expand any sport to view its rules</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSports ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : sportsWithRules.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No sports with rules found.</p>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {sportsWithRules.map((sport) => (
                      <AccordionItem key={sport.id} value={sport.id}>
                        <AccordionTrigger className="text-left">
                          {sport.name}
                        </AccordionTrigger>
                        <AccordionContent>
                          <SportRulesContent rules={sport.rules} rulesFileUrl={sport.rulesFileUrl} />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="formats" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                  Tournament Formats
                </CardTitle>
                <CardDescription>Expand any sport to view its competition format</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSports ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : sportsWithFormats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No tournament formats found.</p>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {sportsWithFormats.map((sport) => (
                      <AccordionItem key={sport.id} value={`format-${sport.id}`}>
                        <AccordionTrigger className="text-left">
                          {sport.name}
                        </AccordionTrigger>
                        <AccordionContent>
                          <SportFormatContent sport={sport} />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
