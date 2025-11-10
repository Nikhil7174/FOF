import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { SportRecord, Convenor } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const sportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["individual", "team"]),
  requiresTeamName: z.boolean(),
  parentId: z.string().optional().nullable(),
  active: z.boolean(),
  venue: z.string().optional(),
  timings: z.string().optional(),
  date: z.string().optional(),
  gender: z.enum(["male", "female", "mixed"]).optional().nullable(),
  ageLimitMin: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().optional()
  ),
  ageLimitMax: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().optional()
  ),
  rules: z.string().optional(),
  convenorName: z.string().optional(),
  convenorPhone: z.string()
    .optional()
    .refine((val) => !val || val.trim() === "" || /^[\d\s\-\+\(\)]+$/.test(val), {
      message: "Phone number can only contain digits, spaces, hyphens, plus, and parentheses",
    }),
  convenorEmail: z.string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  adminEmail: z.string()
    .email("Invalid email address")
    .optional()
    .nullable()
    .or(z.literal("")),
  adminPassword: z.string().optional().nullable(),
});

type SportFormData = z.infer<typeof sportSchema>;

export function SportManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<SportRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sportToDelete, setSportToDelete] = useState<SportRecord | null>(null);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  const { data: sports = [], isLoading: isLoadingSports } = useQuery({
    queryKey: ["sports"],
    queryFn: api.listSports,
  });

  const { data: convenors = [] } = useQuery({
    queryKey: ["convenors"],
    queryFn: api.listConvenors,
  });

  const form = useForm<SportFormData>({
    resolver: zodResolver(sportSchema),
    defaultValues: {
      name: "",
      type: "individual",
      requiresTeamName: false,
      parentId: null,
      active: true,
      venue: "",
      timings: "",
      date: "",
      gender: null,
      ageLimitMin: "" as any,
      ageLimitMax: "" as any,
      rules: "",
      convenorName: "",
      convenorPhone: "",
      convenorEmail: "",
      adminEmail: "",
      adminPassword: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SportFormData) => {
      // Convert empty strings to null for optional fields
      const sportData: Omit<SportRecord, "id"> = {
        name: data.name,
        type: data.type,
        requiresTeamName: data.requiresTeamName,
        parentId: data.parentId ?? null,
        active: data.active,
        venue: data.venue?.trim() || null,
        timings: data.timings?.trim() || null,
        // Only include date if it's a non-empty string, otherwise set to null to clear it
        date: data.date?.trim() && data.date.trim().length > 0 ? data.date.trim() : null,
        gender: data.gender ?? null,
        adminEmail: data.adminEmail?.trim() && data.adminEmail.trim().length > 0 ? data.adminEmail.trim() : null,
        adminPassword: data.adminPassword?.trim() && data.adminPassword.trim().length > 0 ? data.adminPassword.trim() : null,
        ageLimit: (data.ageLimitMin !== undefined && data.ageLimitMin !== null && data.ageLimitMin !== "") || 
                  (data.ageLimitMax !== undefined && data.ageLimitMax !== null && data.ageLimitMax !== "")
          ? {
              min: data.ageLimitMin !== undefined && data.ageLimitMin !== null && data.ageLimitMin !== "" 
                ? (typeof data.ageLimitMin === "string" ? Number(data.ageLimitMin) : data.ageLimitMin) 
                : null,
              max: data.ageLimitMax !== undefined && data.ageLimitMax !== null && data.ageLimitMax !== "" 
                ? (typeof data.ageLimitMax === "string" ? Number(data.ageLimitMax) : data.ageLimitMax) 
                : null,
            }
          : null,
        rules: data.rules?.trim() || null,
      };
      const sport = await api.createSport(sportData);
      
      // Create convenor if provided (with null safety)
      if (sport?.id && data.convenorName?.trim() && data.convenorPhone?.trim() && data.convenorEmail?.trim()) {
        try {
          await api.createConvenor({
            name: data.convenorName.trim(),
            phone: data.convenorPhone.trim(),
            email: data.convenorEmail.trim(),
            sportId: sport.id,
          });
        } catch (convenorError) {
          console.error("Error creating convenor:", convenorError);
          // Don't fail the whole creation if convenor creation fails
        }
      }
      
      return sport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sports"] });
      queryClient.invalidateQueries({ queryKey: ["convenors"] });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error("Error creating sport:", error);
      const errorMessage = error?.message || error?.error || error?.toString() || "Unknown error";
      alert(`Error creating sport: ${errorMessage}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SportFormData> }) => {
      console.log("Update mutation called with id:", id, "data:", data);
      if (!id) {
        throw new Error("Sport ID is required for update");
      }
      
      const sportData: Partial<Omit<SportRecord, "id">> = {};
      // Always include these fields when updating
      if (data.name !== undefined) sportData.name = data.name;
      if (data.type !== undefined) sportData.type = data.type;
      if (data.requiresTeamName !== undefined) sportData.requiresTeamName = data.requiresTeamName;
      if (data.parentId !== undefined) sportData.parentId = data.parentId ?? null;
      if (data.active !== undefined) sportData.active = data.active;
      if (data.venue !== undefined) sportData.venue = data.venue?.trim() || null;
      if (data.timings !== undefined) sportData.timings = data.timings?.trim() || null;
      // Only include date if it's a non-empty string, otherwise set to null to clear it
      if (data.date !== undefined) {
        const trimmedDate = data.date?.trim();
        if (trimmedDate && trimmedDate.length > 0) {
          sportData.date = trimmedDate;
        } else {
          // Send null to clear the date (backend schema now allows null)
          sportData.date = null;
        }
      }
      if (data.gender !== undefined) sportData.gender = data.gender ?? null;
      
      // Handle age limits - check if values are provided (not empty strings, null, or undefined)
      const hasMinAge = data.ageLimitMin !== undefined && data.ageLimitMin !== null && data.ageLimitMin !== "";
      const hasMaxAge = data.ageLimitMax !== undefined && data.ageLimitMax !== null && data.ageLimitMax !== "";
      
      if (hasMinAge || hasMaxAge) {
        sportData.ageLimit = {
          min: hasMinAge ? (typeof data.ageLimitMin === "string" ? Number(data.ageLimitMin) : data.ageLimitMin) : null,
          max: hasMaxAge ? (typeof data.ageLimitMax === "string" ? Number(data.ageLimitMax) : data.ageLimitMax) : null,
        };
      } else if (data.ageLimitMin !== undefined || data.ageLimitMax !== undefined) {
        // Explicitly set to null if both are empty (to clear age limit)
        sportData.ageLimit = null;
      }
      
      if (data.rules !== undefined) sportData.rules = data.rules?.trim() || null;
      
      // Handle admin email and password
      if (data.adminEmail !== undefined) {
        sportData.adminEmail = data.adminEmail?.trim() && data.adminEmail.trim().length > 0 ? data.adminEmail.trim() : null;
      }
      // Only update adminPassword if it's provided and not the masked value
      if (data.adminPassword !== undefined && data.adminPassword !== "***" && data.adminPassword.trim() !== "") {
        sportData.adminPassword = data.adminPassword.trim();
      } else if (data.adminPassword === "") {
        // Empty string means clear it
        sportData.adminPassword = null;
      }
      // If adminPassword is "***" or undefined, don't include it (keep existing)
      
      console.log("Sending sportData to API:", sportData);
      const sport = await api.updateSport(id, sportData);
      console.log("API response:", sport);
      
      // Handle convenor update - fetch current convenors with null safety
      try {
        const currentConvenors = await api.listConvenors();
        const existingConvenor = currentConvenors?.find(c => c?.sportId === id);
        
        const hasConvenorData = data.convenorName?.trim() && data.convenorPhone?.trim() && data.convenorEmail?.trim();
        
        if (hasConvenorData) {
          if (existingConvenor?.id) {
            await api.updateConvenor(existingConvenor.id, {
              name: data.convenorName.trim(),
              phone: data.convenorPhone.trim(),
              email: data.convenorEmail.trim(),
            });
          } else {
            await api.createConvenor({
              name: data.convenorName.trim(),
              phone: data.convenorPhone.trim(),
              email: data.convenorEmail.trim(),
              sportId: id,
            });
          }
        } else if (existingConvenor?.id) {
          // Remove convenor if fields are cleared
          await api.deleteConvenor(existingConvenor.id);
        }
      } catch (convenorError) {
        console.error("Error updating convenor:", convenorError);
        // Don't fail the whole update if convenor update fails
      }
      
      return sport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sports"] });
      queryClient.invalidateQueries({ queryKey: ["convenors"] });
      setDialogOpen(false);
      setEditingSport(null);
      form.reset();
    },
    onError: (error: any) => {
      console.error("Error updating sport:", error);
      const errorMessage = error?.message || error?.error || error?.toString() || "Unknown error";
      alert(`Error updating sport: ${errorMessage}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!id) {
        throw new Error("Sport ID is required for deletion");
      }
      return api.deleteSport(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sports"] });
      setDeleteDialogOpen(false);
      setSportToDelete(null);
    },
    onError: (error: any) => {
      console.error("Error deleting sport:", error);
      const errorMessage = error?.message || error?.error || error?.toString() || "Unknown error";
      alert(`Error deleting sport: ${errorMessage}`);
      setDeleteDialogOpen(false);
    },
  });

  const handleOpenDialog = (sport?: SportRecord) => {
    if (sport?.id) {
      setEditingSport(sport);
      const convenor = convenors?.find(c => c?.sportId === sport.id) ?? null;
      // Format date for date input (YYYY-MM-DD format)
      let formattedDate = "";
      if (sport.date) {
        try {
          const dateObj = typeof sport.date === "string" ? new Date(sport.date) : sport.date;
          if (!isNaN(dateObj.getTime())) {
            // Format as YYYY-MM-DD for date input
            formattedDate = dateObj.toISOString().split("T")[0];
          }
        } catch (e) {
          console.error("Error formatting date:", e);
        }
      }
      
      form.reset({
        name: sport.name ?? "",
        type: sport.type ?? "individual",
        requiresTeamName: sport.requiresTeamName ?? false,
        parentId: sport.parentId ?? null,
        active: sport.active ?? true,
        venue: sport.venue ?? "",
        timings: sport.timings ?? "",
        date: formattedDate,
        gender: sport.gender ?? null,
        ageLimitMin: (sport.ageLimit?.min !== undefined && sport.ageLimit?.min !== null) ? String(sport.ageLimit.min) : "" as any,
        ageLimitMax: (sport.ageLimit?.max !== undefined && sport.ageLimit?.max !== null) ? String(sport.ageLimit.max) : "" as any,
        rules: sport.rules ?? "",
        convenorName: convenor?.name ?? "",
        convenorPhone: convenor?.phone ?? "",
        convenorEmail: convenor?.email ?? "",
        adminEmail: sport.adminEmail ?? "",
        adminPassword: sport.adminPassword ? "***" : "", // Mask existing password
      });
    } else {
      setEditingSport(null);
      form.reset();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (data: SportFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Editing sport:", editingSport);
    console.log("Form errors:", form.formState.errors);
    
    // Safety check: ensure required fields are present
    if (!data.name?.trim()) {
      alert("Sport name is required");
      return;
    }
    
    if (editingSport?.id) {
      console.log("Calling update mutation with id:", editingSport.id);
      updateMutation.mutate({ id: editingSport.id, data });
    } else {
      console.log("Calling create mutation");
      createMutation.mutate(data);
    }
  };

  const handleSubmitError = (errors: any) => {
    console.log("Form validation errors:", errors);
    alert(`Form validation failed. Please check the form fields.\nErrors: ${JSON.stringify(errors, null, 2)}`);
  };

  const handleDelete = (sport: SportRecord) => {
    if (sport?.id) {
      setSportToDelete(sport);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = () => {
    if (sportToDelete?.id) {
      deleteMutation.mutate(sportToDelete.id);
    } else {
      console.error("Cannot delete: sport ID is missing");
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sports Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Sport
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSport ? "Edit Sport" : "Create New Sport"}</DialogTitle>
              <DialogDescription>
                {editingSport ? "Update the sport details below." : "Fill in the details to create a new sport."}
              </DialogDescription>
            </DialogHeader>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Form onSubmit triggered");
                console.log("Form values:", form.getValues());
                console.log("Form errors:", form.formState.errors);
                form.handleSubmit(handleSubmit, handleSubmitError)(e);
              }} 
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Sport Name *</Label>
                  <Input id="name" {...form.register("name")} placeholder="Sport name" />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={form.watch("type")}
                    onValueChange={(value) => form.setValue("type", value as "individual" | "team")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentId">Parent Sport (optional)</Label>
                <Select
                  value={form.watch("parentId") ?? "none"}
                  onValueChange={(value) => form.setValue("parentId", value === "none" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No parent (top-level sport)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No parent</SelectItem>
                    {sports
                      .filter((s) => !s.parentId)
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input id="venue" {...form.register("venue")} placeholder="e.g., Main Stadium" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timings">Timings</Label>
                  <Input id="timings" {...form.register("timings")} placeholder="e.g., 09:00 - 17:00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" {...form.register("date")} placeholder="Date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
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
                </div>
              </div>

              <div className="space-y-2">
                <Label>Age Limit</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="number"
                      placeholder="Min age"
                      {...form.register("ageLimitMin")}
                    />
                    {form.formState.errors.ageLimitMin && (
                      <p className="text-sm text-destructive">{form.formState.errors.ageLimitMin.message}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Max age"
                      {...form.register("ageLimitMax")}
                    />
                    {form.formState.errors.ageLimitMax && (
                      <p className="text-sm text-destructive">{form.formState.errors.ageLimitMax.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rules">Rules</Label>
                <Textarea
                  id="rules"
                  {...form.register("rules")}
                  placeholder="Enter sport rules (supports markdown)"
                  rows={6}
                />
              </div>

              <div className="space-y-4 border-t pt-4">
                <Label className="text-base font-semibold">Convenor Information</Label>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="convenorName">Convenor Name</Label>
                    <Input id="convenorName" {...form.register("convenorName")} placeholder="Convenor name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="convenorPhone">Convenor Phone</Label>
                      <Input id="convenorPhone" {...form.register("convenorPhone")} placeholder="Phone number" />
                      {form.formState.errors.convenorPhone && (
                        <p className="text-sm text-destructive">{form.formState.errors.convenorPhone.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="convenorEmail">Convenor Email</Label>
                      <Input id="convenorEmail" type="email" {...form.register("convenorEmail")} placeholder="Email address" />
                      {form.formState.errors.convenorEmail && (
                        <p className="text-sm text-destructive">{form.formState.errors.convenorEmail.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <Label className="text-base font-semibold">Sports Admin Credentials</Label>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email</Label>
                    <Input id="adminEmail" type="email" {...form.register("adminEmail")} placeholder="admin@sport.com" />
                    {form.formState.errors.adminEmail && (
                      <p className="text-sm text-destructive">{form.formState.errors.adminEmail.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">
                      Admin Password {editingSport && "(leave blank to keep current)"}
                    </Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      {...form.register("adminPassword")}
                      placeholder={editingSport ? "Leave blank to keep current" : "Password for sports admin"}
                    />
                    {form.formState.errors.adminPassword && (
                      <p className="text-sm text-destructive">{form.formState.errors.adminPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresTeamName"
                  checked={form.watch("requiresTeamName")}
                  onCheckedChange={(checked) => form.setValue("requiresTeamName", checked === true)}
                />
                <Label htmlFor="requiresTeamName" className="font-normal cursor-pointer">
                  Requires Team Name
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={form.watch("active")}
                  onCheckedChange={(checked) => form.setValue("active", checked === true)}
                />
                <Label htmlFor="active" className="font-normal cursor-pointer">
                  Active
                </Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingSport ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Timings</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Age Limit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingSports ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : sports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No sports found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              sports
                .filter((s) => s?.id && !s?.parentId)
                .map((parent) => (
                  <React.Fragment key={parent.id}>
                    <TableRow>
                      <TableCell className="font-medium">
                        <button
                          type="button"
                          className="inline-flex items-center mr-2"
                          onClick={() =>
                            setExpandedParents((prev) => ({ ...prev, [parent.id ?? ""]: !prev[parent.id ?? ""] }))
                          }
                          aria-label="Toggle children"
                        >
                          {sports.some((s) => s?.parentId === parent.id) ? (
                            expandedParents[parent.id ?? ""] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                          ) : (
                            <span className="inline-block w-4" />
                          )}
                        </button>
                        {parent.name ?? "-"}
                      </TableCell>
                      <TableCell>{parent.type ?? "-"}</TableCell>
                      <TableCell>{parent.venue ?? "-"}</TableCell>
                      <TableCell>{parent.timings ?? "-"}</TableCell>
                      <TableCell>{parent.date ? new Date(parent.date).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>{parent.gender ?? "Any"}</TableCell>
                      <TableCell>
                        {parent.ageLimit?.min !== null && parent.ageLimit?.min !== undefined || 
                         parent.ageLimit?.max !== null && parent.ageLimit?.max !== undefined
                          ? `${parent.ageLimit?.min ?? "?"}-${parent.ageLimit?.max ?? "?"}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${parent.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {parent.active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenDialog(parent)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(parent)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedParents[parent.id ?? ""] &&
                      sports
                        .filter((c) => c?.parentId === parent.id)
                        .map((child) => (
                          <TableRow key={child.id}>
                            <TableCell className="font-medium pl-8">└─ {child.name ?? "-"}</TableCell>
                            <TableCell>{child.type ?? "-"}</TableCell>
                            <TableCell>{child.venue ?? "-"}</TableCell>
                            <TableCell>{child.timings ?? "-"}</TableCell>
                            <TableCell>{child.date ? new Date(child.date).toLocaleDateString() : "-"}</TableCell>
                            <TableCell>{child.gender ?? "Any"}</TableCell>
                            <TableCell>
                              {child.ageLimit?.min !== null && child.ageLimit?.min !== undefined || 
                               child.ageLimit?.max !== null && child.ageLimit?.max !== undefined
                                ? `${child.ageLimit?.min ?? "?"}-${child.ageLimit?.max ?? "?"}`
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs ${child.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                {child.active ? "Active" : "Inactive"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(child)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(child)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                  </React.Fragment>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sport "{sportToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

