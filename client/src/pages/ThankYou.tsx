import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function ThankYou() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto">
          <Card className="shadow-card animate-fade-in">
            <CardHeader>
              <CardTitle>Thank You for Registering!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We have received your registration. A confirmation email has been sent from
                {" "}
                <span className="font-medium">registration@fof.co.ke</span>.
                Your community representative will review your entry shortly.
              </p>
              <div className="flex gap-3">
                <Button asChild>
                  <Link to="/">Go to Home</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link to="/calendar">View Sports Calendar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


