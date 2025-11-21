import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import type { SettingsRecord } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, X, Home, Image, Type, Upload, Loader2, RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DEFAULT_AGE_REFERENCE = "2026-11-01";

function formatDateForInput(dateString?: string | null) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export function SettingsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [freezeDate, setFreezeDate] = useState<string>("");
  const [ageDate, setAgeDate] = useState<string>("");
  const [siteTitle, setSiteTitle] = useState<string>("");
  const [siteIconUrl, setSiteIconUrl] = useState<string>("");
  const [heroImageUrl, setHeroImageUrl] = useState<string>("");
  const [heroTitle, setHeroTitle] = useState<string>("");
  const [heroSubtitle, setHeroSubtitle] = useState<string>("");
  const [heroDescription, setHeroDescription] = useState<string>("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: api.getSettings,
  });

  const settings = settingsQuery.data as SettingsRecord | undefined;
  const isLoading = settingsQuery.isLoading;

  useEffect(() => {
    setFreezeDate(formatDateForInput(settings?.profileFreezeDate));
  }, [settings?.profileFreezeDate]);

  useEffect(() => {
    setAgeDate(formatDateForInput(settings?.ageCalculatorDate || DEFAULT_AGE_REFERENCE));
  }, [settings?.ageCalculatorDate]);

  useEffect(() => {
    setSiteTitle(settings?.siteTitle || "");
    setSiteIconUrl(settings?.siteIconUrl || "");
    setHeroImageUrl(settings?.heroImageUrl || "");
    setHeroTitle(settings?.heroTitle || "");
    setHeroSubtitle(settings?.heroSubtitle || "");
    setHeroDescription(settings?.heroDescription || "");
  }, [settings]);

  const freezeDefaultValue = formatDateForInput(settings?.profileFreezeDate);
  const ageDefaultValue = formatDateForInput(settings?.ageCalculatorDate || DEFAULT_AGE_REFERENCE);
  const isFreezeChanged = freezeDate !== (freezeDefaultValue || "");
  const isAgeChanged = ageDate !== ageDefaultValue;

  const updateMutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({
        title: "Settings Updated",
        description: "Settings have been updated successfully.",
      });
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
    if (!isFreezeChanged) return;
    const dateValue = freezeDate || null;
    updateMutation.mutate({
      profileFreezeDate: dateValue ? new Date(dateValue).toISOString() : null,
    });
  };

  const handleClearFreezeDate = () => {
    updateMutation.mutate({
      profileFreezeDate: null,
    });
    setFreezeDate("");
  };

  const handleUpdateAgeDate = () => {
    if (!isAgeChanged) return;
    const dateValue = ageDate || formatDateForInput(settings?.ageCalculatorDate || DEFAULT_AGE_REFERENCE);
    updateMutation.mutate({
      ageCalculatorDate: dateValue
        ? new Date(dateValue).toISOString()
        : new Date(DEFAULT_AGE_REFERENCE).toISOString(),
    });
  };

  const uploadImageMutation = useMutation({
    mutationFn: api.uploadImage,
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error?.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (file: File, field: "siteIcon" | "heroImage") => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image size must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await uploadImageMutation.mutateAsync(file);
      if (field === "siteIcon") {
        setSiteIconUrl(result.url);
        toast({
          title: "Image Uploaded",
          description: "Site icon has been uploaded successfully.",
        });
      } else if (field === "heroImage") {
        setHeroImageUrl(result.url);
        toast({
          title: "Image Uploaded",
          description: "Hero image has been uploaded successfully.",
        });
      }
    } catch (error) {
      // Error is already handled by the mutation's onError
    }
  };

  const handleUpdateHomeScreen = () => {
    const hasChanges = 
      siteTitle !== (settings?.siteTitle || "") ||
      siteIconUrl !== (settings?.siteIconUrl || "") ||
      heroImageUrl !== (settings?.heroImageUrl || "") ||
      heroTitle !== (settings?.heroTitle || "") ||
      heroSubtitle !== (settings?.heroSubtitle || "") ||
      heroDescription !== (settings?.heroDescription || "");

    if (!hasChanges) return;

    updateMutation.mutate({
      siteTitle: siteTitle || null,
      siteIconUrl: siteIconUrl || null,
      heroImageUrl: heroImageUrl || null,
      heroTitle: heroTitle || null,
      heroSubtitle: heroSubtitle || null,
      heroDescription: heroDescription || null,
    });
  };

  const handleResetHomeScreen = () => {
    // Reset all home screen fields to empty
    setSiteTitle("");
    setSiteIconUrl("");
    setHeroImageUrl("");
    setHeroTitle("");
    setHeroSubtitle("");
    setHeroDescription("");

    // Update settings to clear all home screen customizations
    updateMutation.mutate({
      siteTitle: null,
      siteIconUrl: null,
      heroImageUrl: null,
      heroTitle: null,
      heroSubtitle: null,
      heroDescription: null,
    });

    setResetDialogOpen(false);
    toast({
      title: "Settings Reset",
      description: "All home screen customizations have been reset to defaults.",
    });
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
                value={freezeDate || ""}
                onChange={(e) => setFreezeDate(e.target.value)}
                placeholder="Select a date"
                className="max-w-xs"
              />
              <Button
                onClick={handleUpdateFreezeDate}
                disabled={updateMutation.isPending || !isFreezeChanged}
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
              <div className="mt-4 p-4 bg-muted rounded-lg w-full xl:w-1/2">
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

      <Card>
        <CardHeader>
          <CardTitle>Age Calculator Date</CardTitle>
          <CardDescription>
            Choose the reference date used for verifying participant ages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ageDate">Age Reference Date</Label>
            <div className="flex gap-2">
              <Input
                id="ageDate"
                type="date"
                value={ageDate || ""}
                onChange={(e) => setAgeDate(e.target.value)}
                placeholder="Select a date"
                className="max-w-xs"
              />
              <Button
                onClick={handleUpdateAgeDate}
                disabled={updateMutation.isPending || !isAgeChanged}
              >
                {settings?.ageCalculatorDate ? "Update" : "Set"} Reference Date
              </Button>
            </div>
            <div className="mt-4 p-4 bg-muted rounded-lg w-full xl:w-1/2">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Current Age Reference:</span>
                <span>
                  {settings?.ageCalculatorDate
                    ? new Date(settings.ageCalculatorDate).toLocaleDateString()
                    : new Date(DEFAULT_AGE_REFERENCE).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Participant ages will be calculated based on this date during registration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Home Screen Customization
          </CardTitle>
          <CardDescription>
            Customize the home screen appearance including site title, icon, hero image, and text content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Site Title & Icon */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Type className="h-4 w-4" />
              <h3 className="font-semibold">Site Branding</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteTitle">Site Title (Navbar)</Label>
              <Input
                id="siteTitle"
                type="text"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                placeholder="e.g., FOF 2026"
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default "FOF 2026"
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteIconUrl">Site Icon (Optional)</Label>
              <div className="space-y-3 max-w-md">
                <div className="space-y-2">
                  <Input
                    id="siteIconUrl"
                    type="url"
                    value={siteIconUrl}
                    onChange={(e) => setSiteIconUrl(e.target.value)}
                    placeholder="https://example.com/icon.png"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a URL to an image
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-border"></div>
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 border-t border-border"></div>
                </div>
                <div className="space-y-2">
                  <div className="relative flex justify-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "siteIcon");
                        e.target.value = ""; // Reset input
                      }}
                      className="hidden"
                      id="siteIconUpload"
                      disabled={uploadImageMutation.isPending}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("siteIconUpload")?.click()}
                      disabled={uploadImageMutation.isPending}
                    >
                      {uploadImageMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image from Device
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Upload an image file from your device
                  </p>
                </div>
              </div>
              {siteIconUrl && (
                <div className="mt-2 flex justify-center max-w-md">
                  <img
                    src={siteIconUrl}
                    alt="Site Icon Preview"
                    className="h-12 w-12 object-contain border rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Hero Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-4">
              <Image className="h-4 w-4" />
              <h3 className="font-semibold">Hero Section</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroImageUrl">Hero Background Image</Label>
              <div className="space-y-3 max-w-md">
                <div className="space-y-2">
                  <Input
                    id="heroImageUrl"
                    type="url"
                    value={heroImageUrl}
                    onChange={(e) => setHeroImageUrl(e.target.value)}
                    placeholder="https://example.com/hero-image.jpg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a URL to an image
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-border"></div>
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 border-t border-border"></div>
                </div>
                <div className="space-y-2">
                  <div className="relative flex justify-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "heroImage");
                        e.target.value = ""; // Reset input
                      }}
                      className="hidden"
                      id="heroImageUpload"
                      disabled={uploadImageMutation.isPending}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("heroImageUpload")?.click()}
                      disabled={uploadImageMutation.isPending}
                    >
                      {uploadImageMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image from Device
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Upload an image file from your device
                  </p>
                </div>
              </div>
              {heroImageUrl && (
                <div className="mt-2 flex justify-center max-w-md">
                  <img
                    src={heroImageUrl}
                    alt="Hero Image Preview"
                    className="max-w-full max-h-48 object-contain border rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroTitle">Hero Title</Label>
              <Input
                id="heroTitle"
                type="text"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="e.g., Welcome to FOF"
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                Main title text. Leave empty to use default "Welcome to FOF 2026".
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
              <Input
                id="heroSubtitle"
                type="text"
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="e.g., A Festival Of Friendship"
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                Subtitle text. Leave empty to use default "A Festival Of Friendship".
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroDescription">Hero Description</Label>
              <Textarea
                id="heroDescription"
                value={heroDescription}
                onChange={(e) => setHeroDescription(e.target.value)}
                placeholder="Description text for the hero section..."
                className="max-w-md min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Description paragraph. Leave empty to use default description.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t flex items-center justify-between">
            <Button
              onClick={handleUpdateHomeScreen}
              disabled={updateMutation.isPending}
            >
              Save Home Screen Settings
            </Button>
            <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={updateMutation.isPending}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset All Settings
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Home Screen Settings?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently reset all home screen customizations including:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Site title and icon</li>
                      <li>Hero background image</li>
                      <li>Hero title, subtitle, and description</li>
                    </ul>
                    <p className="mt-2">The home screen will revert to default values. This action cannot be undone.</p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetHomeScreen}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Reset Settings
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


