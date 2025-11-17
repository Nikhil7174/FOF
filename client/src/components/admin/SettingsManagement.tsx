import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, X } from "lucide-react";

export function SettingsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [freezeDate, setFreezeDate] = useState<string>("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: api.getSettings,
  });

  const updateMutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({
        title: "Settings Updated",
        description: "Settings have been updated successfully.",
      });
      setFreezeDate("");
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateFreezeDate = () => {
    const dateValue = freezeDate || null;
    updateMutation.mutate({
      profileFreezeDate: dateValue ? new Date(dateValue).toISOString() : null,
    });
  };

  const handleClearFreezeDate = () => {
    updateMutation.mutate({
      profileFreezeDate: null,
    });
  };

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString?: string | null) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  // Check if freeze date has passed
  const isFrozen = () => {
    if (!settings?.profileFreezeDate) return false;
    const now = new Date();
    const freeze = new Date(settings.profileFreezeDate);
    freeze.setHours(23, 59, 59, 999);
    return now > freeze;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Manage application settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Freeze Date</CardTitle>
          <CardDescription>
            Set a date after which participants cannot update their profile or sports selection.
            Leave empty to allow updates at any time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="freezeDate">Freeze Date</Label>
            <div className="flex gap-2">
              <Input
                id="freezeDate"
                type="date"
                value={freezeDate || formatDateForInput(settings?.profileFreezeDate)}
                onChange={(e) => setFreezeDate(e.target.value)}
                placeholder="Select a date"
                className="max-w-xs"
              />
              <Button
                onClick={handleUpdateFreezeDate}
                disabled={updateMutation.isPending}
              >
                {settings?.profileFreezeDate ? "Update" : "Set"} Freeze Date
              </Button>
              {settings?.profileFreezeDate && (
                <Button
                  variant="outline"
                  onClick={handleClearFreezeDate}
                  disabled={updateMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
            {settings?.profileFreezeDate && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Current Freeze Date:</span>
                  <span>{new Date(settings.profileFreezeDate).toLocaleDateString()}</span>
                </div>
                {isFrozen() ? (
                  <p className="text-sm text-destructive font-medium">
                    Profile updates are currently frozen. Participants cannot edit their profile or sports selection.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Profile updates will be frozen after this date.
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}


