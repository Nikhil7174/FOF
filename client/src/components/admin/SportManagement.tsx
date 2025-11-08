import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { SportRecord } from "@/types";
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
  parentId: z.string().optional(),
  active: z.boolean(),
  venue: z.string().optional(),
  timings: z.string().optional(),
  date: z.string().optional(),
  gender: z.enum(["male", "female", "mixed"]).optional().nullable(),
  ageLimitMin: z.coerce.number().optional(),
  ageLimitMax: z.coerce.number().optional(),
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

  const form = useForm<SportFormData>({
    resolver: zodResolver(sportSchema),
    defaultValues: {
      name: "",
      type: "individual",
      requiresTeamName: false,
      parentId: undefined,
      active: true,
      venue: "",
      timings: "",
      date: "",
      gender: null,
      ageLimitMin: undefined,
      ageLimitMax: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: SportFormData) => {
      const sportData: Omit<SportRecord, "id"> = {
        name: data.name,
        type: data.type,
        requiresTeamName: data.requiresTeamName,
        parentId: data.parentId || undefined,
        active: data.active,
        venue: data.venue || undefined,
        timings: data.timings || undefined,
        date: data.date || undefined,
        gender: data.gender || undefined,
        ageLimit: (data.ageLimitMin || data.ageLimitMax)
          ? {
              min: data.ageLimitMin,
              max: data.ageLimitMax,
            }
          : undefined,
      };
      return api.createSport(sportData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sports"] });
      setDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SportFormData> }) => {
      const sportData: Partial<Omit<SportRecord, "id">> = {};
      if (data.name !== undefined) sportData.name = data.name;
      if (data.type !== undefined) sportData.type = data.type;
      if (data.requiresTeamName !== undefined) sportData.requiresTeamName = data.requiresTeamName;
      if (data.parentId !== undefined) sportData.parentId = data.parentId || undefined;
      if (data.active !== undefined) sportData.active = data.active;
      if (data.venue !== undefined) sportData.venue = data.venue || undefined;
      if (data.timings !== undefined) sportData.timings = data.timings || undefined;
      if (data.date !== undefined) sportData.date = data.date || undefined;
      if (data.gender !== undefined) sportData.gender = data.gender || undefined;
      if (data.ageLimitMin !== undefined || data.ageLimitMax !== undefined) {
        sportData.ageLimit = {
          min: data.ageLimitMin,
          max: data.ageLimitMax,
        };
      }
      return api.updateSport(id, sportData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sports"] });
      setDialogOpen(false);
      setEditingSport(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sports"] });
      setDeleteDialogOpen(false);
      setSportToDelete(null);
    },
  });

  const handleOpenDialog = (sport?: SportRecord) => {
    if (sport) {
      setEditingSport(sport);
      form.reset({
        name: sport.name,
        type: sport.type,
        requiresTeamName: sport.requiresTeamName,
        parentId: sport.parentId,
        active: sport.active,
        venue: sport.venue || "",
        timings: sport.timings || "",
        date: sport.date || "",
        gender: sport.gender || null,
        ageLimitMin: sport.ageLimit?.min,
        ageLimitMax: sport.ageLimit?.max,
      });
    } else {
      setEditingSport(null);
      form.reset();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (data: SportFormData) => {
    if (editingSport) {
      updateMutation.mutate({ id: editingSport.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (sport: SportRecord) => {
    setSportToDelete(sport);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (sportToDelete) {
      deleteMutation.mutate(sportToDelete.id);
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
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                  value={form.watch("parentId") || "none"}
                  onValueChange={(value) => form.setValue("parentId", value === "none" ? undefined : value)}
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
                      {...form.register("ageLimitMin", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Max age"
                      {...form.register("ageLimitMax", { valueAsNumber: true })}
                    />
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
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
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
                .filter((s) => !s.parentId)
                .map((parent) => (
                  <>
                    <TableRow key={parent.id}>
                      <TableCell className="font-medium">
                        <button
                          type="button"
                          className="inline-flex items-center mr-2"
                          onClick={() =>
                            setExpandedParents((prev) => ({ ...prev, [parent.id]: !prev[parent.id] }))
                          }
                          aria-label="Toggle children"
                        >
                          {sports.some((s) => s.parentId === parent.id) ? (
                            expandedParents[parent.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                          ) : (
                            <span className="inline-block w-4" />
                          )}
                        </button>
                        {parent.name}
                      </TableCell>
                      <TableCell>{parent.type}</TableCell>
                      <TableCell>{parent.venue || "-"}</TableCell>
                      <TableCell>{parent.timings || "-"}</TableCell>
                      <TableCell>{parent.date || "-"}</TableCell>
                      <TableCell>{parent.gender || "Any"}</TableCell>
                      <TableCell>
                        {parent.ageLimit
                          ? `${parent.ageLimit.min || "?"}-${parent.ageLimit.max || "?"}`
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
                    {expandedParents[parent.id] &&
                      sports
                        .filter((c) => c.parentId === parent.id)
                        .map((child) => (
                          <TableRow key={child.id}>
                            <TableCell className="font-medium pl-8">└─ {child.name}</TableCell>
                            <TableCell>{child.type}</TableCell>
                            <TableCell>{child.venue || "-"}</TableCell>
                            <TableCell>{child.timings || "-"}</TableCell>
                            <TableCell>{child.date || "-"}</TableCell>
                            <TableCell>{child.gender || "Any"}</TableCell>
                            <TableCell>
                              {child.ageLimit
                                ? `${child.ageLimit.min || "?"}-${child.ageLimit.max || "?"}`
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
                  </>
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

