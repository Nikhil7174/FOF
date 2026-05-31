import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import type { SettingsRecord } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, RotateCcw } from "lucide-react";
import {
  DEFAULT_DISCLAIMER_TEXT,
  DEFAULT_TERMS_AND_CONDITIONS_TEXT,
} from "@/constants/legal";

export function TermsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [termsAndConditionsText, setTermsAndConditionsText] = useState("");
  const [disclaimerText, setDisclaimerText] = useState("");

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: api.getSettings,
  });

  const settings = settingsQuery.data as SettingsRecord | undefined;

  useEffect(() => {
    setTermsAndConditionsText(settings?.termsAndConditionsText || "");
    setDisclaimerText(settings?.disclaimerText || "");
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({
        title: "Terms Updated",
        description: "Disclaimer and terms have been saved successfully.",
      });
    },
    onError: (error: { message?: string }) => {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update terms. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const hasChanges =
      termsAndConditionsText !== (settings?.termsAndConditionsText || "") ||
      disclaimerText !== (settings?.disclaimerText || "");

    if (!hasChanges) return;

    updateMutation.mutate({
      termsAndConditionsText: termsAndConditionsText || null,
      disclaimerText: disclaimerText || null,
    });
  };

  const handleReset = () => {
    setTermsAndConditionsText("");
    setDisclaimerText("");
    updateMutation.mutate({
      termsAndConditionsText: null,
      disclaimerText: null,
    });
    toast({
      title: "Reset to Defaults",
      description: "Public page and registration will use the built-in default text.",
    });
  };

  const isUnchanged =
    termsAndConditionsText === (settings?.termsAndConditionsText || "") &&
    disclaimerText === (settings?.disclaimerText || "");

  if (settingsQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Terms &amp; Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Disclaimer &amp; Terms &amp; Conditions
        </CardTitle>
        <CardDescription>
          Edit the content shown on the public Terms page and on the registration form. Leave a field
          empty to use the built-in default placeholder text.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="adminTermsText">Terms &amp; Conditions</Label>
          <Textarea
            id="adminTermsText"
            value={termsAndConditionsText}
            onChange={(e) => setTermsAndConditionsText(e.target.value)}
            placeholder={DEFAULT_TERMS_AND_CONDITIONS_TEXT.slice(0, 120) + "..."}
            className="min-h-[220px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Full text for the /terms page and registration scroll panel.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminDisclaimerText">Disclaimer</Label>
          <Textarea
            id="adminDisclaimerText"
            value={disclaimerText}
            onChange={(e) => setDisclaimerText(e.target.value)}
            placeholder={DEFAULT_DISCLAIMER_TEXT}
            className="min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground">
            Shown on the Terms page and as the registration agreement checkbox label.
          </p>
        </div>
        <div className="pt-4 border-t flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={updateMutation.isPending || isUnchanged}>
            Save Changes
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={updateMutation.isPending}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
