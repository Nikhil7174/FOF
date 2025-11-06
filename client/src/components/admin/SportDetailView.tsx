import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useAuth } from "@/hooks/api/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const sportUpdateSchema = z.object({
  venue: z.string().optional(),
  timings: z.string().optional(),
  date: z.string().optional(),
  gender: z.enum(["male", "female", "mixed"]).optional().nullable(),
  ageLimitMin: z.coerce.number().optional(),
  ageLimitMax: z.coerce.number().optional(),
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

  const form = useForm<SportUpdateFormData>({
    resolver: zodResolver(sportUpdateSchema),
  });

  useEffect(() => {
    if (sport && !isEditing) {
      form.reset({
        venue: sport.venue || "",
        timings: sport.timings || "",
        date: sport.date || "",
        gender: sport.gender || null,
        ageLimitMin: sport.ageLimit?.min,
        ageLimitMax: sport.ageLimit?.max,
      });
    }
  }, [sport, isEditing, form]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SportUpdateFormData> }) => {
      const sportData: any = {};
      if (data.venue !== undefined) sportData.venue = data.venue || undefined;
      if (data.timings !== undefined) sportData.timings = data.timings || undefined;
      if (data.date !== undefined) sportData.date = data.date || undefined;
      if (data.gender !== undefined) sportData.gender = data.gender || undefined;
      if (data.ageLimitMin !== undefined || data.ageLimitMax !== undefined) {
        sportData.ageLimit = { min: data.ageLimitMin, max: data.ageLimitMax };
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
    updateMutation.mutate({ id: sport.id, data });
  };

  const handleCancel = () => {
    form.reset({
      venue: sport.venue || "",
      timings: sport.timings || "",
      date: sport.date || "",
      gender: sport.gender || null,
      ageLimitMin: sport.ageLimit?.min,
      ageLimitMax: sport.ageLimit?.max,
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                {isEditing ? (
                  <Input id="venue" {...form.register("venue")} placeholder="Venue" />
                ) : (
                  <Input value={sport.venue || "Not set"} disabled className="bg-muted" />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="timings">Timings</Label>
                {isEditing ? (
                  <Input id="timings" {...form.register("timings")} placeholder="e.g., 09:00 - 17:00" />
                ) : (
                  <Input value={sport.timings || "Not set"} disabled className="bg-muted" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                {isEditing ? (
                  <Input id="date" type="date" {...form.register("date")} placeholder="Date" />
                ) : (
                  <Input value={sport.date || "Not set"} disabled className="bg-muted" />
                )}
              </div>
              <div className="space-y-2">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Age Limit</Label>
                <div className="grid grid-cols-2 gap-4">
                  {isEditing ? (
                    <>
                      <Input type="number" placeholder="Min age" {...form.register("ageLimitMin", { valueAsNumber: true })} />
                      <Input type="number" placeholder="Max age" {...form.register("ageLimitMax", { valueAsNumber: true })} />
                    </>
                  ) : (
                    <>
                      <Input value={sport.ageLimit?.min || ""} disabled className="bg-muted" placeholder="Min age" />
                      <Input value={sport.ageLimit?.max || ""} disabled className="bg-muted" placeholder="Max age" />
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
