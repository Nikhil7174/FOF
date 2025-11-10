import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { CalendarItem, SportRecord } from "@/types";
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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const calendarItemSchema = z.object({
  sportId: z.string().min(1, "Please select a sport"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  venue: z.string().min(1, "Venue is required"),
  type: z.string().min(1, "Type is required"),
});

type CalendarItemFormData = z.infer<typeof calendarItemSchema>;

export function CalendarManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CalendarItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CalendarItem | null>(null);
  const queryClient = useQueryClient();

  const { data: calendarItems = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ["calendar"],
    queryFn: api.listCalendar,
  });

  const { data: sports = [] } = useQuery({
    queryKey: ["sports"],
    queryFn: api.listSports,
  });

  const form = useForm<CalendarItemFormData>({
    resolver: zodResolver(calendarItemSchema),
    defaultValues: {
      sportId: "",
      date: "",
      time: "",
      venue: "",
      type: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CalendarItemFormData) => {
      return api.createCalendarItem({
        sportId: data.sportId,
        date: data.date,
        time: data.time,
        venue: data.venue,
        type: data.type,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      setDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CalendarItemFormData> }) => {
      return api.updateCalendarItem(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      setDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCalendarItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
  });

  const handleOpenDialog = (item?: CalendarItem) => {
    if (item) {
      setEditingItem(item);
      const dateStr = new Date(item.date).toISOString().split("T")[0];
      form.reset({
        sportId: item.sportId,
        date: dateStr,
        time: item.time,
        venue: item.venue,
        type: item.type,
      });
    } else {
      setEditingItem(null);
      form.reset();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (data: CalendarItemFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (item: CalendarItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  const getSportName = (sportId: string) => {
    const sport = sports.find((s) => s.id === sportId);
    if (!sport) return "Unknown";
    // If it's a child sport, show parent - child format
    if (sport.parentId) {
      const parent = sports.find((s) => s.id === sport.parentId);
      return parent ? `${parent.name} - ${sport.name}` : sport.name;
    }
    return sport.name;
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sports Calendar Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Calendar Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Calendar Item" : "Create New Calendar Item"}</DialogTitle>
              <DialogDescription>
                {editingItem ? "Update the calendar item details below." : "Fill in the details to create a new calendar item."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sportId">Sport *</Label>
                <Controller
                  name="sportId"
                  control={form.control}
                  render={({ field }) => (
                    <SportSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select a sport"
                    />
                  )}
                />
                {form.formState.errors.sportId && (
                  <p className="text-sm text-destructive">{form.formState.errors.sportId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input id="date" type="date" {...form.register("date")} />
                  {form.formState.errors.date && (
                    <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input id="time" type="time" {...form.register("time")} />
                  {form.formState.errors.time && (
                    <p className="text-sm text-destructive">{form.formState.errors.time.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue">Venue *</Label>
                <Input id="venue" {...form.register("venue")} placeholder="e.g., Main Stadium" />
                {form.formState.errors.venue && (
                  <p className="text-sm text-destructive">{form.formState.errors.venue.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Input id="type" {...form.register("type")} placeholder="e.g., Match, Practice, Event" />
                {form.formState.errors.type && (
                  <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingItem ? "Update" : "Create"}
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
              <TableHead>Sport</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingItems ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : calendarItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No calendar items found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              calendarItems.map((item) => {
                const date = new Date(item.date);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{getSportName(item.sportId)}</TableCell>
                    <TableCell>{date.toLocaleDateString()}</TableCell>
                    <TableCell>{item.time}</TableCell>
                    <TableCell>{item.venue}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(item)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this calendar item.
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

