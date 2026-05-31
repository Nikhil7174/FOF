import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { SportRecord, Convenor } from "@/types";
import { getSportCounts } from "@/utils/sportParticipantCounts";
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
import { ExportButton } from "@/components/ui/export-button";
import { SportSelect } from "@/components/ui/sport-select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const usernamePattern = /^[a-zA-Z0-9_.-]{3,30}$/;

const sportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["individual", "team"]),
  requiresTeamName: z.boolean(),
  parentId: z.string().optional().nullable(),
  active: z.boolean(),
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
  notes: z.string().max(500).optional().nullable(),
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
  adminUsername: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.trim().length === 0 || usernamePattern.test(val.trim()), {
      message: "Username must be 3-30 characters (letters, numbers, dots, hyphens or underscores)",
    }),
  adminEmail: z.string()
    .email("Invalid email address")
    .optional()
    .nullable()
    .or(z.literal("")),
  adminPassword: z.string().optional().nullable(),
  incompatibleSportIds: z.array(z.string()).optional(),
});

type SportFormData = z.infer<typeof sportSchema>;

export function SportManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<SportRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sportToDelete, setSportToDelete] = useState<SportRecord | null>(null);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});
  const [incompatibleSportsOpen, setIncompatibleSportsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: sports = [], isLoading: isLoadingSports } = useQuery({
    queryKey: ["sports"],
    queryFn: api.listSports,
  });

  const { data: convenors = [] } = useQuery({
    queryKey: ["convenors"],
    queryFn: api.listConvenors,
  });

  const { data: participantStats } = useQuery({
    queryKey: ["participantStats"],
    queryFn: api.getParticipantStats,
  });

  const form = useForm<SportFormData>({
    resolver: zodResolver(sportSchema),
    defaultValues: {
      name: "",
      type: "individual",
      requiresTeamName: false,
      parentId: null,
      active: true,
      gender: null,
      ageLimitMin: "" as any,
      ageLimitMax: "" as any,
      rules: "",
      notes: "",
      convenorName: "",
      convenorPhone: "",
      convenorEmail: "",
      adminUsername: "",
      adminEmail: "",
      adminPassword: "",
      incompatibleSportIds: [],
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
        gender: data.gender ?? null,
        adminUsername: data.adminUsername?.trim() && data.adminUsername.trim().length > 0 ? data.adminUsername.trim() : null,
        adminEmail: data.adminEmail?.trim() && data.adminEmail.trim().length > 0 ? data.adminEmail.trim() : null,
        adminPassword: data.adminPassword?.trim() && data.adminPassword.trim().length > 0 ? data.adminPassword.trim() : null,
        rules: data.rules?.trim() || null,
        notes: data.notes?.trim() && data.notes.trim().length > 0 ? data.notes.trim() : null,
        ...(data.ageLimitMin != null ? { ageLimitMin: data.ageLimitMin } : {}),
        ...(data.ageLimitMax != null ? { ageLimitMax: data.ageLimitMax } : {}),
      };
      const sport = await api.createSport({
        ...sportData,
        // For new sports: include incompatible sports if it's a sub-sport OR a parent (we allow it initially)
        // When editing, we'll check for children and clear if needed
        incompatibleSportIds: data.incompatibleSportIds || [],
      });
      
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
      if (data.gender !== undefined) sportData.gender = data.gender ?? null;
      
      // Age limits are optional — send each field only when present in the form (null clears it)
      if (data.ageLimitMin !== undefined) {
        sportData.ageLimitMin = data.ageLimitMin;
      }
      if (data.ageLimitMax !== undefined) {
        sportData.ageLimitMax = data.ageLimitMax;
      }

      if (data.rules !== undefined) sportData.rules = data.rules?.trim() || null;
      if (data.notes !== undefined) sportData.notes = data.notes?.trim() && data.notes.trim().length > 0 ? data.notes.trim() : null;
      
      // Handle admin email and password
      if (data.adminEmail !== undefined) {
        sportData.adminEmail = data.adminEmail?.trim() && data.adminEmail.trim().length > 0 ? data.adminEmail.trim() : null;
      }
      if (data.adminUsername !== undefined) {
        const trimmed = data.adminUsername?.trim() || "";
        sportData.adminUsername = trimmed.length > 0 ? trimmed : null;
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
      // Check if this is a parent sport with children
      const isParentWithChildren = !data.parentId && sports.some((s) => s.parentId === id);
      
      const sport = await api.updateSport(id, {
        ...sportData,
        // Include incompatible sports if it's a sub-sport OR a parent without children
        incompatibleSportIds: (data.parentId || (!data.parentId && !isParentWithChildren)) 
          ? (data.incompatibleSportIds || []) 
          : [],
      });
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
      form.reset({
        name: sport.name ?? "",
        type: sport.type ?? "individual",
        requiresTeamName: sport.requiresTeamName ?? false,
        parentId: sport.parentId ?? null,
        active: sport.active ?? true,
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
        rules: sport.rules ?? "",
        notes: (sport as any).notes ?? "",
        convenorName: convenor?.name ?? "",
        convenorPhone: convenor?.phone ?? "",
        convenorEmail: convenor?.email ?? "",
        adminUsername: sport.adminUsername ?? "",
        adminEmail: sport.adminEmail ?? "",
        adminPassword: sport.adminPassword ? "***" : "", // Mask existing password
        // Load incompatible sports if this is a sub-sport OR a parent without children
        incompatibleSportIds: (() => {
          if (sport.parentId) {
            // Sub-sport: load incompatible sports
            return (sport as any).incompatibleWith?.map((inc: any) => inc.incompatibleSportId) || [];
          } else {
            // Parent sport: check if it has children
            const hasChildren = sports.some((s) => s.parentId === sport.id);
            if (!hasChildren) {
              // Parent without children: load incompatible sports
              return (sport as any).incompatibleWith?.map((inc: any) => inc.incompatibleSportId) || [];
            }
            // Parent with children: don't load incompatible sports
            return [];
          }
        })(),
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

    const trimmedAdminUsername = data.adminUsername?.trim() || "";
    const adminUsernameChanged = trimmedAdminUsername !== (editingSport?.adminUsername ?? "");
    if (trimmedAdminUsername && (!data.adminPassword || data.adminPassword === "***" || data.adminPassword.trim() === "")) {
      if (!editingSport || adminUsernameChanged) {
        form.setError("adminPassword", {
          type: "manual",
          message: "Admin password is required when assigning a username",
        });
        return;
      }
    }

    const submission: SportFormData = {
      ...data,
      adminUsername: trimmedAdminUsername,
      adminEmail: data.adminEmail?.trim() || "",
    };
    
    if (editingSport?.id) {
      console.log("Calling update mutation with id:", editingSport.id);
      updateMutation.mutate({ id: editingSport.id, data: submission });
    } else {
      console.log("Calling create mutation");
      createMutation.mutate(submission);
    }
  };

  const handleSubmitError = (errors: any) => {
    console.log("Form validation errors:", errors);
    // Extract error messages without circular references
    const errorMessages: Record<string, string> = {};
    if (errors && typeof errors === 'object') {
      Object.keys(errors).forEach((key) => {
        const error = errors[key];
        if (error?.message) {
          errorMessages[key] = error.message;
        } else if (typeof error === 'string') {
          errorMessages[key] = error;
        }
      });
    }
    const errorText = Object.keys(errorMessages).length > 0
      ? Object.entries(errorMessages).map(([field, message]) => `${field}: ${message}`).join('\n')
      : 'Please check the form fields for errors.';
    alert(`Form validation failed.\n\n${errorText}`);
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
        <div className="flex gap-2">
          <ExportButton
            onExportCSV={() => api.exportSports("csv")}
            onExportExcel={() => api.exportSports("excel")}
            disabled={isLoadingSports}
          />
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
                  onValueChange={(value) => {
                    const newParentId = value === "none" ? null : value;
                    const currentSportId = editingSport?.id;
                    form.setValue("parentId", newParentId);
                    // Clear incompatible sports if becoming a parent sport WITH children
                    if (!newParentId && currentSportId) {
                      const hasChildren = sports.some((s) => s.parentId === currentSportId);
                      if (hasChildren) {
                        form.setValue("incompatibleSportIds", []);
                      }
                    }
                  }}
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

              <div className="space-y-2 max-w-xs">
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

              <div className="space-y-2">
                <Label>Age Limit <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="number"
                      min={0}
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
                      min={0}
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

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...form.register("notes")}
                  placeholder="Add any additional notes about this sport (optional)"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  Up to 500 characters. These notes are visible to participants when selecting sports.
                </p>
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
                  <Label htmlFor="adminUsername">Admin Username</Label>
                  <Input
                    id="adminUsername"
                    {...form.register("adminUsername")}
                    placeholder="sports_admin"
                    spellCheck={false}
                  />
                  <p className="text-xs text-muted-foreground">
                    Usernames can contain letters, numbers, dots, hyphens or underscores.
                  </p>
                  {form.formState.errors.adminUsername && (
                    <p className="text-sm text-destructive">{form.formState.errors.adminUsername.message}</p>
                  )}
                </div>

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

              {/* Show incompatible sports for sub-sports OR parent sports without children */}
              {(() => {
                const currentParentId = form.watch("parentId");
                const currentSportId = editingSport?.id;
                // For new sports (no editingSport), always show if it's a parent (we'll allow it)
                // For existing sports, check if it has children
                if (!currentSportId) {
                  // New sport: show for both sub-sports and parent sports
                  return true;
                }
                // Existing sport: check if it has children
                const hasChildren = !currentParentId 
                  ? sports.some((s) => s.parentId === currentSportId)
                  : false;
                // Show if it's a sub-sport (has parentId) OR if it's a parent without children
                return currentParentId || (!currentParentId && !hasChildren);
              })() && (
                <div className="space-y-2">
                  <Label htmlFor="incompatibleSports">Incompatible Sports</Label>
                  <p className="text-sm text-muted-foreground">
                    Select sports that cannot be selected together with this sport during registration
                  </p>
                  <Popover open={incompatibleSportsOpen} onOpenChange={setIncompatibleSportsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {form.watch("incompatibleSportIds")?.length > 0
                        ? `${form.watch("incompatibleSportIds").length} sport(s) selected`
                        : "Select incompatible sports..."}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search sports..." />
                      <CommandList className="max-h-60">
                        <CommandEmpty>No sports found.</CommandEmpty>
                        {sports
                          .filter((s) => !s.parentId && (editingSport ? s.id !== editingSport.id : true))
                          .map((parent) => {
                            const children = sports.filter((s) => s.parentId === parent.id && (editingSport ? s.id !== editingSport.id : true));
                            const hasChildren = children.length > 0;
                            
                            return (
                              <CommandGroup key={parent.id} heading={parent.name}>
                                {hasChildren ? (
                                  // If parent has children, only show children as selectable
                                  children.map((child) => {
                                    const isSelected = form.watch("incompatibleSportIds")?.includes(child.id) || false;
                                    return (
                                      <CommandItem
                                        key={child.id}
                                        value={`${parent.name} ${child.name}`}
                                        onSelect={() => {
                                          const current = form.watch("incompatibleSportIds") || [];
                                          if (isSelected) {
                                            form.setValue("incompatibleSportIds", current.filter((id) => id !== child.id));
                                          } else {
                                            form.setValue("incompatibleSportIds", [...current, child.id]);
                                          }
                                        }}
                                        className="flex items-center gap-2 ml-4"
                                      >
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() => {
                                            const current = form.watch("incompatibleSportIds") || [];
                                            if (isSelected) {
                                              form.setValue("incompatibleSportIds", current.filter((id) => id !== child.id));
                                            } else {
                                              form.setValue("incompatibleSportIds", [...current, child.id]);
                                            }
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        {child.name}
                                      </CommandItem>
                                    );
                                  })
                                ) : (
                                  // If parent has no children, show parent as selectable
                                  (() => {
                                    const parentSelected = form.watch("incompatibleSportIds")?.includes(parent.id) || false;
                                    return (
                                      <CommandItem
                                        value={parent.name}
                                        onSelect={() => {
                                          const current = form.watch("incompatibleSportIds") || [];
                                          if (parentSelected) {
                                            form.setValue("incompatibleSportIds", current.filter((id) => id !== parent.id));
                                          } else {
                                            form.setValue("incompatibleSportIds", [...current, parent.id]);
                                          }
                                        }}
                                        className="flex items-center gap-2"
                                      >
                                        <Checkbox
                                          checked={parentSelected}
                                          onCheckedChange={() => {
                                            const current = form.watch("incompatibleSportIds") || [];
                                            if (parentSelected) {
                                              form.setValue("incompatibleSportIds", current.filter((id) => id !== parent.id));
                                            } else {
                                              form.setValue("incompatibleSportIds", [...current, parent.id]);
                                            }
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        {parent.name}
                                      </CommandItem>
                                    );
                                  })()
                                )}
                              </CommandGroup>
                            );
                          })}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {form.watch("incompatibleSportIds")?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch("incompatibleSportIds").map((sportId) => {
                      const sport = sports.find((s) => s.id === sportId);
                      if (!sport) return null;
                      const sportName = sport.parentId
                        ? `${sports.find((p) => p.id === sport.parentId)?.name || ""} - ${sport.name}`
                        : sport.name;
                      return (
                        <Badge key={sportId} variant="secondary" className="gap-1">
                          {sportName}
                          <button
                            type="button"
                            onClick={() => {
                              const current = form.watch("incompatibleSportIds") || [];
                              form.setValue("incompatibleSportIds", current.filter((id) => id !== sportId));
                            }}
                            className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
                </div>
              )}

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
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Age Limit</TableHead>
              <TableHead>Participants</TableHead>
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
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : sports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                      <TableCell>{parent.gender ?? "Any"}</TableCell>
                      <TableCell>
                        {(parent.ageLimitMin ?? parent.ageLimit?.min) != null ||
                         (parent.ageLimitMax ?? parent.ageLimit?.max) != null
                          ? [
                              (parent.ageLimitMin ?? parent.ageLimit?.min) != null
                                ? String(parent.ageLimitMin ?? parent.ageLimit?.min)
                                : null,
                              (parent.ageLimitMax ?? parent.ageLimit?.max) != null
                                ? String(parent.ageLimitMax ?? parent.ageLimit?.max)
                                : null,
                            ]
                              .filter(Boolean)
                              .join("–")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {participantStats ? (
                          <ParticipantCountsCell
                            {...getSportCounts(parent, sports, participantStats.bySportId)}
                          />
                        ) : (
                          "—"
                        )}
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
                            <TableCell>{child.gender ?? "Any"}</TableCell>
                            <TableCell>
                              {(child.ageLimitMin ?? child.ageLimit?.min) != null ||
                               (child.ageLimitMax ?? child.ageLimit?.max) != null
                                ? [
                                    (child.ageLimitMin ?? child.ageLimit?.min) != null
                                      ? String(child.ageLimitMin ?? child.ageLimit?.min)
                                      : null,
                                    (child.ageLimitMax ?? child.ageLimit?.max) != null
                                      ? String(child.ageLimitMax ?? child.ageLimit?.max)
                                      : null,
                                  ]
                                    .filter(Boolean)
                                    .join("–")
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {participantStats ? (
                                <ParticipantCountsCell
                                  {...getSportCounts(child, sports, participantStats.bySportId, false)}
                                />
                              ) : (
                                "—"
                              )}
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

function ParticipantCountsCell({
  registered,
  accepted,
}: {
  registered: number;
  accepted: number;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border bg-muted/30 text-sm">
      <div className="px-3 py-1.5 text-center border-r">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Registered</div>
        <div className="font-semibold tabular-nums leading-tight">{registered}</div>
      </div>
      <div className="px-3 py-1.5 text-center">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Accepted</div>
        <div className="font-semibold tabular-nums leading-tight text-green-700 dark:text-green-400">
          {accepted}
        </div>
      </div>
    </div>
  );
}

