import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { convenors, sportsRules } from "@/data/constants";
import { Trophy, Phone, Mail, BookOpen } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Sports() {
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {convenors.map((convenor, index) => (
                <Card key={convenor.id} className="hover:shadow-card transition-shadow animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      {convenor.name}
                    </CardTitle>
                    <CardDescription>{convenor.sport}</CardDescription>
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
                <Accordion type="multiple" className="w-full">
                  {Object.entries(sportsRules).map(([sport, rules]) => (
                    <AccordionItem key={sport} value={sport}>
                      <AccordionTrigger className="text-left">
                        {sport.charAt(0).toUpperCase() + sport.slice(1)}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="prose prose-sm max-w-none text-foreground">
                          {rules.split('\n').map((line, i) => (
                            <p key={i} className="mb-2">{line}</p>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="formats" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Formats</CardTitle>
                <CardDescription>Competition structure for each sport</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Team Sports</h3>
                  <p className="text-muted-foreground">
                    Football, Basketball, Volleyball, and Cricket will follow a round-robin group stage 
                    followed by knockout semifinals and finals.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Individual Sports</h3>
                  <p className="text-muted-foreground">
                    Athletics, Swimming, Table Tennis, and Badminton will have preliminary heats, 
                    followed by quarterfinals, semifinals, and finals based on timing/scores.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Points System</h3>
                  <p className="text-muted-foreground">
                    Communities earn points based on rankings: Gold (10 points), Silver (7 points), 
                    Bronze (5 points), and participation (3 points per sport).
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
