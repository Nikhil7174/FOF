import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { getDisclaimerDisplayText, getTermsDisplayText } from "@/constants/legal";
import { FileText, Shield } from "lucide-react";

export default function Terms() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: api.getSettings,
    retry: 1,
  });

  const termsText = getTermsDisplayText(settings);
  const disclaimerText = getDisclaimerDisplayText(settings);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Disclaimer &amp; Terms &amp; Conditions</h1>
        <p className="text-muted-foreground mb-8">
          Please read the following before registering for FOF 2026.
        </p>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-primary" />
                Terms &amp; Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {termsText}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="h-5 w-5 text-primary" />
                Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">{disclaimerText}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
