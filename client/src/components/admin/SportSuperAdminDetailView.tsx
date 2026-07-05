import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/api";
import { useAuth } from "@/hooks/api/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSportCounts } from "@/utils/sportParticipantCounts";
import { SportRulesContent } from "@/components/SportRulesContent";
import { SportFormatContent, hasSportFormat } from "@/components/SportFormatContent";
import { BookOpen, Edit, LayoutGrid, Save, Upload, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const sportEditSchema = z.object({
  venue: z.string().optional().nullable(),
  timings: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  gender: z.enum(["male", "female", "mixed"]).optional().nullable(),
  ageLimitMin: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    },
    z.number().nullable().optional()
  ),
  ageLimitMax: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    },
    z.number().nullable().optional()
  ),
  rules: z.string().optional(),
  formatCategory: z.string().optional(),
  formatTeam: z.string().optional(),
  formatGender: z.string().optional(),
  formatGeneral: z.string().optional(),
  notes: z.string().max(500).optional().nullable(),
  convenorName: z.string().optional(),
  convenorPhone: z.string()
    .optional()
    .refine((val) => !val || val.trim() === "" || /^[\d\s\-\+\(\)]+$/.test(val), {
      message: "Phone number can only contain digits, spaces, hyphens, plus, and parentheses",
    }),
  convenorEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
});

type SportEditFormData = z.infer<typeof sportEditSchema>;

function formatDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function SportSuperAdminDetailView({ overviewOnly = false }: { overviewOnly?: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [rulesFileUrl, setRulesFileUrl] = useState("");
  const [rulesFileName, setRulesFileName] = useState("");
  const [formatFileUrl, setFormatFileUrl] = useState("");
  const [formatFileName, setFormatFileName] = useState("");
  const [isUploadingRules, setIsUploadingRules] = useState(false);
  const [isUploadingFormat, setIsUploadingFormat] = useState(false);
  const [drawsFileUrl, setDrawsFileUrl] = useState("");
  const [drawsFileName, setDrawsFileName] = useState("");
  const [isUploadingDraws, setIsUploadingDraws] = useState(false);
  const drawsUrlInputRef = React.useRef<HTMLInputElement>(null);

  const { data: sport, isLoading: isLoadingSport } = useQuery({
    queryKey: ["sport", user?.sportId],
    queryFn: () => (user?.sportId ? api.getSport(user.sportId) : null),
    enabled: !!user?.sportId,
  });

  const { data: sports = [] } = useQuery({
    queryKey: ["sports"],
    queryFn: api.listSports,
    enabled: !!user?.sportId,
  });

  const { data: convenors = [] } = useQuery({
    queryKey: ["convenors"],
    queryFn: api.listConvenors,
    enabled: !!user?.sportId,
  });

  const { data: participantStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["participantStats"],
    queryFn: api.getParticipantStats,
    enabled: !!user?.sportId,
  });

  const form = useForm<SportEditFormData>({
    resolver: zodResolver(sportEditSchema),
    defaultValues: {
      venue: "",
      timings: "",
      date: "",
      gender: null,
      rules: "",
      formatCategory: "",
      formatTeam: "",
      formatGender: "",
      formatGeneral: "",
      notes: "",
      convenorName: "",
      convenorPhone: "",
      convenorEmail: "",
    },
  });

  const sportCounts = useMemo(() => {
    if (!participantStats || !sport) {
      return { registered: 0, accepted: 0 };
    }
    const includeChildren = !sport.parentId;
    return getSportCounts(sport, sports, participantStats.bySportId, includeChildren);
  }, [participantStats, sport, sports]);

  const convenor = convenors.find((c) => c.sportId === sport?.id);

  const resetFormFromSport = () => {
    if (!sport) return;
    setRulesFileUrl(sport.rulesFileUrl || "");
    setRulesFileName(sport.rulesFileUrl ? sport.rulesFileUrl.split("/").pop() || "Rules document" : "");
    setFormatFileUrl(sport.formatFileUrl || "");
    setFormatFileName(sport.formatFileUrl ? sport.formatFileUrl.split("/").pop() || "Format document" : "");
    setDrawsFileUrl(sport.drawsFileUrl || "");
    setDrawsFileName(sport.drawsFileUrl ? sport.drawsFileUrl.split("/").pop() || "Draws document" : "");
    form.reset({
      venue: sport.venue ?? "",
      timings: sport.timings ?? "",
      date: formatDateInput(sport.date),
      gender: sport.gender ?? null,
      ageLimitMin:
        sport.ageLimitMin != null
          ? String(sport.ageLimitMin)
          : sport.ageLimit?.min != null
            ? String(sport.ageLimit.min)
            : ("" as any),
      ageLimitMax:
        sport.ageLimitMax != null
          ? String(sport.ageLimitMax)
          : sport.ageLimit?.max != null
            ? String(sport.ageLimit.max)
            : ("" as any),
      rules: sport.rulesFileUrl ? "" : (sport.rules ?? ""),
      formatCategory: sport.formatCategory ?? "",
      formatTeam: sport.formatTeam ?? "",
      formatGender: sport.formatGender ?? "",
      formatGeneral: sport.formatGeneral ?? "",
      notes: sport.notes ?? "",
      convenorName: convenor?.name ?? "",
      convenorPhone: convenor?.phone ?? "",
      convenorEmail: convenor?.email ?? "",
    });
  };

  const saveMutation = useMutation({
    mutationFn: async (data: SportEditFormData) => {
      if (!sport?.id) throw new Error("No sport assigned");

      const sportData: Record<string, unknown> = {
        venue: data.venue?.trim() || null,
        timings: data.timings?.trim() || null,
        date: data.date?.trim() ? data.date : null,
        gender: data.gender ?? null,
        ageLimitMin: data.ageLimitMin ?? null,
        ageLimitMax: data.ageLimitMax ?? null,
        formatCategory: data.formatCategory?.trim() || null,
        formatTeam: data.formatTeam?.trim() || null,
        formatGender: data.formatGender?.trim() || null,
        formatGeneral: data.formatGeneral?.trim() || null,
        formatFileUrl: formatFileUrl || null,
        drawsFileUrl: drawsUrlInputRef.current?.value?.trim() || drawsFileUrl || null,
        notes: data.notes?.trim() || null,
      };

      if (rulesFileUrl) {
        sportData.rules = null;
        sportData.rulesFileUrl = rulesFileUrl;
      } else {
        sportData.rules = data.rules?.trim() || null;
        sportData.rulesFileUrl = null;
      }

      const updated = await api.updateSport(sport.id, sportData as any);

      const hasConvenorData = Boolean(data.convenorName?.trim());
      if (hasConvenorData) {
        if (convenor?.id) {
          await api.updateConvenor(convenor.id, {
            name: data.convenorName!.trim(),
            phone: data.convenorPhone?.trim() || "",
            email: data.convenorEmail?.trim() || "",
          });
        } else {
          await api.createConvenor({
            name: data.convenorName!.trim(),
            phone: data.convenorPhone?.trim() || "",
            email: data.convenorEmail?.trim() || "",
            sportId: sport.id,
          });
        }
      } else if (convenor?.id) {
        await api.deleteConvenor(convenor.id);
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sport", user?.sportId] });
      queryClient.invalidateQueries({ queryKey: ["convenors"] });
      setIsEditing(false);
      toast({ title: "Saved", description: "Sport details updated successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error?.message || "Could not update sport details.",
        variant: "destructive",
      });
    },
  });

  const handleRulesFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploadingRules(true);
    try {
      const result = await api.uploadSportRulesFile(file);
      setRulesFileUrl(result.url);
      setRulesFileName(result.filename);
      form.setValue("rules", "");
    } catch (error: any) {
      toast({ title: "Upload failed", description: error?.message || "Could not upload rules file.", variant: "destructive" });
    } finally {
      setIsUploadingRules(false);
    }
  };

  const handleFormatPdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !sport?.name) return;

    setIsUploadingFormat(true);
    try {
      const result = await api.uploadSportFormatPdf(file, sport.name);
      setFormatFileUrl(result.url);
      setFormatFileName(result.filename);
      form.setValue("formatCategory", result.formatCategory || "");
      form.setValue("formatTeam", result.formatTeam || "");
      form.setValue("formatGender", result.formatGender || "");
      form.setValue("formatGeneral", result.formatGeneral || "");
    } catch (error: any) {
      toast({ title: "Upload failed", description: error?.message || "Could not extract format from PDF.", variant: "destructive" });
    } finally {
      setIsUploadingFormat(false);
    }
  };

  const handleDrawsFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploadingDraws(true);
    try {
      const result = await api.uploadSportDrawsFile(file);
      setDrawsFileUrl(result.url);
      setDrawsFileName(result.filename);
    } catch (error: any) {
      toast({ title: "Upload failed", description: error?.message || "Could not upload draws file.", variant: "destructive" });
    } finally {
      setIsUploadingDraws(false);
    }
  };

  if (isLoadingSport) {
    return <Skeleton className="h-64 w-full max-w-3xl mx-auto" />;
  }

  if (!sport) {
    return <div className="text-center text-muted-foreground">No sport assigned to your account.</div>;
  }

  const ageMin = sport.ageLimitMin ?? sport.ageLimit?.min;
  const ageMax = sport.ageLimitMax ?? sport.ageLimit?.max;
  const ageLabel = ageMin != null || ageMax != null ? `${ageMin ?? "?"} – ${ageMax ?? "?"}` : "Any";

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {isLoadingStats ? (
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium leading-snug min-h-[2.75rem]">
                Registered Participants
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold tabular-nums leading-none">{sportCounts.registered}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium leading-snug min-h-[2.75rem]">
                Accepted Participants
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold tabular-nums leading-none">{sportCounts.accepted}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{sport.name}</CardTitle>
            <CardDescription>
              {overviewOnly
                ? "Summary of your assigned sport."
                : isEditing
                  ? "Edit sport details, rules, formats, and convenor for your assigned sport."
                  : "View and edit sport details, rules, formats, and convenor."}
            </CardDescription>
          </div>
          {!overviewOnly && (
            !isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetFormFromSport();
                  setIsEditing(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetFormFromSport();
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={saveMutation.isPending}
                  onClick={form.handleSubmit((data) => saveMutation.mutate(data))}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            )
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {overviewOnly || !isEditing ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Type:</span> {sport.type}</div>
                <div><span className="text-muted-foreground">Gender:</span> {sport.gender || "Any"}</div>
                <div><span className="text-muted-foreground">Age Limit:</span> {ageLabel}</div>
                <div><span className="text-muted-foreground">Venue:</span> {sport.venue || "—"}</div>
                <div><span className="text-muted-foreground">Timings:</span> {sport.timings || "—"}</div>
                <div><span className="text-muted-foreground">Date:</span> {sport.date ? formatDateInput(sport.date) : "—"}</div>
              </div>
              {convenor && (
                <div className="border-t pt-4 space-y-2">
                  <Label className="text-base font-semibold">Convenor</Label>
                  <p className="text-sm">{convenor.name} · {convenor.phone} · {convenor.email}</p>
                </div>
              )}
            </>
          ) : (
            <form className="space-y-6" onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input id="venue" {...form.register("venue")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timings">Timings</Label>
                  <Input id="timings" {...form.register("timings")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" {...form.register("date")} />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={form.watch("gender") ?? "none"}
                    onValueChange={(value) =>
                      form.setValue("gender", value === "none" ? null : (value as "male" | "female" | "mixed"))
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="Any gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Any</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Min Age</Label>
                  <Input type="number" min={0} {...form.register("ageLimitMin")} />
                </div>
                <div className="space-y-2">
                  <Label>Max Age</Label>
                  <Input type="number" min={0} {...form.register("ageLimitMax")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" rows={3} {...form.register("notes")} />
              </div>

              <div className="space-y-3 border rounded-lg p-4">
                <Label className="text-base">Convenor</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input placeholder="Name" {...form.register("convenorName")} />
                  <Input placeholder="Phone" {...form.register("convenorPhone")} />
                  <Input placeholder="Email" type="email" {...form.register("convenorEmail")} />
                </div>
              </div>

              <div className="space-y-3 border rounded-lg p-4">
                <Label className="text-base">Sport Rules</Label>
                {rulesFileUrl ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={rulesFileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                      <FileText className="h-4 w-4" />{rulesFileName || "Rules document"}
                    </a>
                    <Button type="button" variant="outline" size="sm" className="text-destructive border-destructive/40" onClick={() => { setRulesFileUrl(""); setRulesFileName(""); }}>
                      <X className="h-4 w-4 mr-1" />Remove PDF
                    </Button>
                  </div>
                ) : (
                  <>
                    <Textarea rows={6} placeholder="Enter sport rules..." {...form.register("rules")} />
                    <Button type="button" variant="outline" size="sm" disabled={isUploadingRules || Boolean(form.watch("rules")?.trim())} onClick={() => document.getElementById("super-admin-rules-file")?.click()}>
                      {isUploadingRules ? "Uploading..." : <><Upload className="h-4 w-4 mr-2" />Upload PDF / DOC</>}
                    </Button>
                    <input id="super-admin-rules-file" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleRulesFileUpload} />
                  </>
                )}
              </div>

              {/* Draws / Fixtures */}
              <div className="space-y-3 border rounded-lg p-4">
                <div>
                  <Label className="text-base">Draws / Fixtures</Label>
                  <p className="text-xs text-muted-foreground mt-1">Upload a PDF or paste a link. Shown on the public Draws &amp; Fixtures tab.</p>
                </div>
                {drawsFileUrl ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={drawsFileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1 max-w-[220px] truncate">
                      <FileText className="h-4 w-4 shrink-0" />{drawsFileName || drawsFileUrl}
                    </a>
                    <Button type="button" variant="outline" size="sm" className="text-destructive border-destructive/40" onClick={() => { setDrawsFileUrl(""); setDrawsFileName(""); }}>
                      <X className="h-4 w-4 mr-1" />Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Link (URL)</Label>
                      <Input
                        ref={drawsUrlInputRef}
                        placeholder="https://example.com/fixture-draw"
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val) { setDrawsFileUrl(val); setDrawsFileName(""); }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val) { setDrawsFileUrl(val); setDrawsFileName(""); }
                          }
                        }}
                      />
                    </div>
                    <div className="relative py-1">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">or</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Upload PDF</Label>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="outline" size="sm" disabled={isUploadingDraws} onClick={() => document.getElementById("super-admin-draws-file")?.click()}>
                          {isUploadingDraws ? "Uploading..." : <><Upload className="h-4 w-4 mr-2" />Upload PDF</>}
                        </Button>
                        <input id="super-admin-draws-file" type="file" accept=".pdf" className="hidden" onChange={handleDrawsFileUpload} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {(overviewOnly || !isEditing) && (sport.rules?.trim() || sport.rulesFileUrl) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Sport Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SportRulesContent rules={sport.rules} rulesFileUrl={sport.rulesFileUrl} />
          </CardContent>
        </Card>
      )}

      {(overviewOnly || !isEditing) && hasSportFormat(sport) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LayoutGrid className="h-5 w-5 text-primary" />
              Tournament Format
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SportFormatContent sport={sport} />
          </CardContent>
        </Card>
      )}

      {(overviewOnly || !isEditing) && sport.drawsFileUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LayoutGrid className="h-5 w-5 text-primary" />
              Draws / Fixtures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SportRulesContent rules={null} rulesFileUrl={sport.drawsFileUrl} title="Official Draws/Fixtures Document" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
