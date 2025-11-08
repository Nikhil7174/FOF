import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { TournamentFormat } from "@/types";
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

const formatSchema = z.object({
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

type FormatFormData = z.infer<typeof formatSchema>;

const formatCategories = [
  { value: "team_sports", label: "Team Sports" },
  { value: "individual_sports", label: "Individual Sports" },
  { value: "points_system", label: "Points System" },
];

export function TournamentFormatsManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFormat, setEditingFormat] = useState<TournamentFormat | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formatToDelete, setFormatToDelete] = useState<TournamentFormat | null>(null);
  const queryClient = useQueryClient();

  const { data: formats = [], isLoading: isLoadingFormats } = useQuery({
    queryKey: ["tournament-formats"],
    queryFn: api.listTournamentFormats,
  });

  const form = useForm<FormatFormData>({
    resolver: zodResolver(formatSchema),
    defaultValues: {
      category: "",
      title: "",
      content: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormatFormData) => {
      return api.createTournamentFormat(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-formats"] });
      setDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FormatFormData> }) => {
      return api.updateTournamentFormat(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-formats"] });
      setDialogOpen(false);
      setEditingFormat(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTournamentFormat(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-formats"] });
      setDeleteDialogOpen(false);
      setFormatToDelete(null);
    },
  });

  const handleOpenDialog = (format?: TournamentFormat) => {
    if (format) {
      setEditingFormat(format);
      form.reset({
        category: format.category,
        title: format.title,
        content: format.content,
      });
    } else {
      setEditingFormat(null);
      form.reset();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (data: FormatFormData) => {
    if (editingFormat) {
      updateMutation.mutate({ id: editingFormat.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (format: TournamentFormat) => {
    setFormatToDelete(format);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (formatToDelete) {
      deleteMutation.mutate(formatToDelete.id);
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = formatCategories.find((c) => c.value === category);
    return cat?.label || category;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tournament Formats Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Format
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFormat ? "Edit Tournament Format" : "Create New Tournament Format"}</DialogTitle>
              <DialogDescription>
                {editingFormat ? "Update the tournament format details below." : "Fill in the details to create a new tournament format."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={form.watch("category")}
                  onValueChange={(value) => form.setValue("category", value)}
                  disabled={!!editingFormat}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {formatCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.category && (
                  <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" {...form.register("title")} placeholder="e.g., Team Sports Format" />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  {...form.register("content")}
                  placeholder="Enter tournament format description (supports markdown)"
                  rows={10}
                />
                {form.formState.errors.content && (
                  <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingFormat ? "Update" : "Create"}
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
              <TableHead>Category</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Content Preview</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingFormats ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : formats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No tournament formats found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              formats.map((format) => (
                <TableRow key={format.id}>
                  <TableCell className="font-medium">{getCategoryLabel(format.category)}</TableCell>
                  <TableCell>{format.title}</TableCell>
                  <TableCell className="max-w-md truncate">{format.content.substring(0, 100)}...</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(format)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(format)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
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
              This action cannot be undone. This will permanently delete the tournament format "{formatToDelete?.title}".
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

