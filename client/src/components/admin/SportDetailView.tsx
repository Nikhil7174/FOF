import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useAuth } from "@/hooks/api/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Save, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getSportCounts } from "@/utils/sportParticipantCounts";

const sportUpdateSchema = z.object({
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
});

type SportUpdateFormData = z.infer<typeof sportUpdateSchema>;

export function SportDetailView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: sport } = useQuery({
    queryKey: ["sport", user?.sportId],
    queryFn: () => user?.sportId ? api.getSport(user.sportId) : null,
    enabled: !!user?.sportId,
  });

  const { data: sports = [] } = useQuery({
    queryKey: ["sports"],
    queryFn: api.listSports,
    enabled: !!user?.sportId,
  });

  const { data: participantStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["participantStats"],
    queryFn: api.getParticipantStats,
    enabled: !!user?.sportId,
  });

  const sportCounts = useMemo(() => {
    if (!participantStats || !sport) {
      return { registered: 0, accepted: 0 };
    }
    const includeChildren = !sport.parentId;
    return getSportCounts(sport, sports, participantStats.bySportId, includeChildren);
  }, [participantStats, sport, sports]);

  const form = useForm<SportUpdateFormData>({
    resolver: zodResolver(sportUpdateSchema),
  });

  useEffect(() => {
    if (sport?.id && !isEditing) {
      form.reset({
        gender: sport.gender ?? null,
        ageLimitMin: sport.ageLimitMin ?? sport.ageLimit?.min ?? ("" as any),
        ageLimitMax: sport.ageLimitMax ?? sport.ageLimit?.max ?? ("" as any),
      });
    }
  }, [sport, isEditing, form]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SportUpdateFormData> }) => {
      if (!id) {
        throw new Error("Sport ID is required for update");
      }
      
      const sportData: any = {};
      if (data.gender !== undefined) sportData.gender = data.gender ?? null;
      if (data.ageLimitMin !== undefined) {
        sportData.ageLimitMin = data.ageLimitMin;
      }
      if (data.ageLimitMax !== undefined) {
        sportData.ageLimitMax = data.ageLimitMax;
      }
      return api.updateSport(id, sportData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sport", user?.sportId] });
      setIsEditing(false);
    },
  });

  if (!sport) {
    return <div className="text-center text-muted-foreground">No sport assigned to your account.</div>;
  }

  const handleSave = (data: SportUpdateFormData) => {
    if (sport?.id) {
      updateMutation.mutate({ id: sport.id, data });
    } else {
      console.error("Cannot save: sport ID is missing");
    }
  };

  const handleCancel = () => {
    if (sport?.id) {
      form.reset({
        gender: sport.gender ?? null,
        ageLimitMin: sport.ageLimitMin ?? sport.ageLimit?.min ?? ("" as any),
        ageLimitMax: sport.ageLimitMax ?? sport.ageLimit?.max ?? ("" as any),
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{sport.name} - Details</CardTitle>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button type="button" onClick={handleCancel} variant="outline" size="sm">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input id="type" value={sport.type} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Input id="status" value={sport.active ? "Active" : "Inactive"} disabled className="bg-muted" />
              </div>
            </div>

            <div className="space-y-2 max-w-xs">
              <Label htmlFor="gender">Gender</Label>
              {isEditing ? (
                <Select
                  value={form.watch("gender") ?? "none"}
                  onValueChange={(value) => form.setValue("gender", value === "none" ? null : value as "male" | "female" | "mixed")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Any</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input value={sport.gender || "Any"} disabled className="bg-muted" />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Age Limit <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <div className="grid grid-cols-2 gap-4">
                  {isEditing ? (
                    <>
                      <Input type="number" min={0} placeholder="Min age (optional)" {...form.register("ageLimitMin")} />
                      <Input type="number" min={0} placeholder="Max age (optional)" {...form.register("ageLimitMax")} />
                    </>
                  ) : (
                    <>
                      <Input value={sport.ageLimitMin ?? sport.ageLimit?.min ?? ""} disabled className="bg-muted" placeholder="Min age" />
                      <Input value={sport.ageLimitMax ?? sport.ageLimit?.max ?? ""} disabled className="bg-muted" placeholder="Max age" />
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="requiresTeamName">Requires Team Name</Label>
                <Input id="requiresTeamName" value={sport.requiresTeamName ? "Yes" : "No"} disabled className="bg-muted" />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
