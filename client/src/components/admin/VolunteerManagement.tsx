import { useMemo, useState, useEffect } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { VolunteerEntry } from "@/api/mockDb";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, ChevronsUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const volunteerAssignSchema = z.object({
  volunteerIds: z.array(z.string()).min(1, "At least one volunteer is required"),
  sportId: z.string().min(1, "Sport is required"),
});

type VolunteerAssignFormData = z.infer<typeof volunteerAssignSchema>;

export function VolunteerManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [volunteerPopoverOpen, setVolunteerPopoverOpen] = useState(false);
  
  const { data: sports = [] } = useQuery({ queryKey: ["sports"], queryFn: api.listSports });
  const { data: volunteers = [], isLoading: volunteersLoading } = useQuery({ 
    queryKey: ["volunteers"], 
    queryFn: async () => {
      const result = await api.listVolunteers();
      console.log("useQuery - API returned:", result);
      console.log("useQuery - Result length:", result?.length || 0);
      return result;
    },
    staleTime: 0,
    cacheTime: 0,
  });
  const { data: departments = [] } = useQuery({ queryKey: ["departments"], queryFn: api.listDepartments });

  // Debug: Log volunteers to console
  useEffect(() => {
    console.log("Volunteers data:", volunteers);
    console.log("Volunteers count:", volunteers?.length || 0);
    console.log("Volunteers loading:", volunteersLoading);
  }, [volunteers, volunteersLoading]);

  const [selectedSportId, setSelectedSportId] = useState<string>("none");

  const form = useForm<VolunteerAssignFormData>({
    resolver: zodResolver(volunteerAssignSchema),
    defaultValues: {
      volunteerIds: [],
      sportId: "",
    },
  });

  const selectedVolunteerIds = form.watch("volunteerIds") || [];

  const assignMutation = useMutation({
    mutationFn: async (data: VolunteerAssignFormData) => {
      // Assign each volunteer to the sport
      const promises = data.volunteerIds.map((volunteerId) =>
        api.updateVolunteer(volunteerId, { sportId: data.sportId })
      );
      await Promise.all(promises);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      form.reset();
      setDialogOpen(false);
      toast({ 
        title: "Success", 
        description: `${selectedVolunteerIds.length} volunteer(s) assigned to sport successfully` 
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to assign volunteers", variant: "destructive" });
    },
  });

  const handleOpenDialog = () => {
    form.reset({
      volunteerIds: [],
      sportId: "",
    });
    setDialogOpen(true);
  };

  const toggleVolunteer = (volunteerId: string) => {
    const current = selectedVolunteerIds;
    if (current.includes(volunteerId)) {
      form.setValue("volunteerIds", current.filter((id) => id !== volunteerId));
    } else {
      form.setValue("volunteerIds", [...current, volunteerId]);
    }
  };

  const filtered = useMemo(() => {
    if (!selectedSportId || selectedSportId === "none") return volunteers;
    return (volunteers as VolunteerEntry[]).filter((v) => v.sportId === selectedSportId);
  }, [volunteers, selectedSportId]);

  const selectedVolunteers = volunteers.filter((v: any) => selectedVolunteerIds.includes(v.id));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="sport">Filter by Sport</Label>
            <Select value={selectedSportId} onValueChange={setSelectedSportId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All sports</SelectItem>
                {sports.filter((s: any) => !s.parentId).map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog} variant="default">
              <Plus className="mr-2 h-4 w-4" />
              Assign Volunteer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Volunteers to Sport</DialogTitle>
              <DialogDescription>Select one or more volunteers and assign them to a sport.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit((data) => assignMutation.mutate(data))} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="volunteer">Volunteers *</Label>
                <Popover open={volunteerPopoverOpen} onOpenChange={setVolunteerPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={volunteerPopoverOpen}
                      className="w-full justify-between"
                    >
                      {selectedVolunteers.length > 0
                        ? `${selectedVolunteers.length} volunteer(s) selected`
                        : "Select volunteers..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command shouldFilter={true} filter={(value, search) => {
                      if (!search) return 1;
                      const searchLower = search.toLowerCase();
                      const valueLower = value.toLowerCase();
                      return valueLower.includes(searchLower) ? 1 : 0;
                    }}>
                      <CommandInput placeholder="Search volunteers..." />
                      <CommandList className="max-h-60">
                        {volunteersLoading ? (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            Loading volunteers...
                          </div>
                        ) : volunteers.length === 0 ? (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No volunteers registered yet.
                          </div>
                        ) : (
                          <>
                            <CommandEmpty>No volunteers found matching your search.</CommandEmpty>
                            <CommandGroup>
                              {volunteers.map((volunteer: any) => {
                                const isSelected = selectedVolunteerIds.includes(volunteer.id);
                                const searchValue = `${volunteer.firstName} ${volunteer.middleName || ""} ${volunteer.lastName} ${volunteer.email}`.toLowerCase().trim();
                                return (
                                  <CommandItem
                                    key={volunteer.id}
                                    value={searchValue}
                                    onSelect={() => toggleVolunteer(volunteer.id)}
                                    className="flex items-center gap-2"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => toggleVolunteer(volunteer.id)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {volunteer.firstName} {volunteer.middleName ? volunteer.middleName + " " : ""}
                                        {volunteer.lastName}
                                      </div>
                                      <div className="text-sm text-muted-foreground">{volunteer.email}</div>
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedVolunteers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedVolunteers.map((volunteer: any) => (
                      <span
                        key={volunteer.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-sm"
                      >
                        {volunteer.firstName} {volunteer.lastName}
                        <button
                          type="button"
                          onClick={() => toggleVolunteer(volunteer.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {form.formState.errors.volunteerIds && (
                  <p className="text-sm text-red-500">{form.formState.errors.volunteerIds.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sportId">Sport *</Label>
                <Select
                  value={form.watch("sportId")}
                  onValueChange={(value) => form.setValue("sportId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports.filter((s: any) => !s.parentId).map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.sportId && (
                  <p className="text-sm text-red-500">{form.formState.errors.sportId.message}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={assignMutation.isPending}>
                  {assignMutation.isPending ? "Assigning..." : `Assign ${selectedVolunteers.length} Volunteer(s)`}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Volunteers ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">No volunteers found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((v) => {
                    const sportName = sports.find((s: any) => s.id === v.sportId)?.name || "-";
                    const departmentName = departments.find((d: any) => d.id === v.departmentId)?.name || v.departmentId;
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{`${v.firstName} ${v.middleName ? v.middleName + " " : ""}${v.lastName}`}</TableCell>
                        <TableCell className="capitalize">{v.gender}</TableCell>
                        <TableCell>{v.dob}</TableCell>
                        <TableCell>{v.email}</TableCell>
                        <TableCell>{v.phone}</TableCell>
                        <TableCell>{departmentName}</TableCell>
                        <TableCell>{sportName}</TableCell>
                        <TableCell>{new Date(v.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
