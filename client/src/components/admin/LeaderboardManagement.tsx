import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { LeaderboardEntry, CommunityRecord, SportRecord } from "@/types";
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
import { SportSelect } from "@/components/ui/sport-select";
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
import { Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const leaderboardEntrySchema = z.object({
  communityId: z.string().min(1, "Community is required"),
  sportId: z.string().min(1, "Sport is required"),
  score: z.number().int().min(0, "Score must be a non-negative integer"),
  position: z.number().int().positive().optional().nullable(),
  medalType: z.enum(["gold", "silver", "bronze", "none"]).optional(),
  notes: z.string().optional().nullable(),
});

type LeaderboardEntryFormData = z.infer<typeof leaderboardEntrySchema>;

export function LeaderboardManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LeaderboardEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<LeaderboardEntry | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: entries = [], isLoading: isLoadingEntries } = useQuery({
    queryKey: ["leaderboard-entries"],
    queryFn: api.listLeaderboardEntries,
  });

  const { data: communities = [] } = useQuery({
    queryKey: ["communities"],
    queryFn: api.listCommunities,
  });

  const { data: sports = [] } = useQuery({
    queryKey: ["sports"],
    queryFn: api.listSports,
  });

  const form = useForm<LeaderboardEntryFormData>({
    resolver: zodResolver(leaderboardEntrySchema),
    defaultValues: {
      communityId: "",
      sportId: "",
      score: 0,
      position: null,
      medalType: "none",
      notes: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: LeaderboardEntryFormData) => api.createLeaderboardEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard-entries"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Score entry created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create score entry",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LeaderboardEntryFormData> }) =>
      api.updateLeaderboardEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard-entries"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      setDialogOpen(false);
      setEditingEntry(null);
      form.reset();
      toast({
        title: "Success",
        description: "Score entry updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update score entry",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteLeaderboardEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard-entries"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
      toast({
        title: "Success",
        description: "Score entry deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete score entry",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (entry?: LeaderboardEntry) => {
    if (entry) {
      setEditingEntry(entry);
      form.reset({
        communityId: entry.communityId,
        sportId: entry.sportId,
        score: entry.score,
        position: entry.position ?? null,
        medalType: entry.medalType,
        notes: entry.notes ?? null,
      });
    } else {
      setEditingEntry(null);
      form.reset({
        communityId: "",
        sportId: "",
        score: 0,
        position: null,
        medalType: "none",
        notes: null,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = (data: LeaderboardEntryFormData) => {
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (entry: LeaderboardEntry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      deleteMutation.mutate(entryToDelete.id);
    }
  };

  const getMedalColor = (medalType: string) => {
    switch (medalType) {
      case "gold":
        return "text-yellow-600 font-semibold";
      case "silver":
        return "text-gray-600 font-semibold";
      case "bronze":
        return "text-orange-600 font-semibold";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Leaderboard Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Score
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? "Edit Score Entry" : "Add New Score Entry"}
              </DialogTitle>
              <DialogDescription>
                {editingEntry
                  ? "Update the score entry details below."
                  : "Fill in the details to add a new score entry for a community in a sport."}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit(handleSubmit)(e);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="communityId">Community *</Label>
                  <Select
                    value={form.watch("communityId")}
                    onValueChange={(value) => form.setValue("communityId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select community" />
                    </SelectTrigger>
                    <SelectContent>
                      {communities.map((community) => (
                        <SelectItem key={community.id} value={community.id}>
                          {community.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.communityId && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.communityId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sportId">Sport *</Label>
                  <SportSelect
                    value={form.watch("sportId")}
                    onValueChange={(value) => form.setValue("sportId", value)}
                    placeholder="Select sport"
                  />
                  {form.formState.errors.sportId && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.sportId.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="score">Score *</Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    {...form.register("score", { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {form.formState.errors.score && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.score.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    type="number"
                    min="1"
                    {...form.register("position", { valueAsNumber: true })}
                    placeholder="1, 2, 3..."
                  />
                  {form.formState.errors.position && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.position?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medalType">Medal Type</Label>
                  <Select
                    value={form.watch("medalType") || "none"}
                    onValueChange={(value) =>
                      form.setValue("medalType", value as "gold" | "silver" | "bronze" | "none")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select medal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="bronze">Bronze</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...form.register("notes")}
                  placeholder="Additional notes about this score entry..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingEntry ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        {isLoadingEntries ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Community</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Medal</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No score entries found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.community?.name || entry.communityId}
                    </TableCell>
                    <TableCell>{entry.sport?.name || entry.sportId}</TableCell>
                    <TableCell className="font-semibold">{entry.score}</TableCell>
                    <TableCell>{entry.position || "-"}</TableCell>
                    <TableCell className={getMedalColor(entry.medalType)}>
                      {entry.medalType !== "none" ? entry.medalType.charAt(0).toUpperCase() + entry.medalType.slice(1) : "-"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {entry.notes || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(entry)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(entry)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the score entry for{" "}
              {entryToDelete?.community?.name} in {entryToDelete?.sport?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

