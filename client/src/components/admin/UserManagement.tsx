import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { User } from "@/types";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Plus, Trash2 } from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const userSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address").optional(),
  password: z.string().optional(),
  role: z.enum(["admin", "community_admin", "sports_admin", "sports_super_admin", "volunteer_admin", "volunteer", "user"]),
  communityId: z.string().optional(),
  sportId: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

type RoleFilter = "all" | User["role"];

const roleFilterOptions: User["role"][] = [
  "admin",
  "community_admin",
  "sports_admin",
  "sports_super_admin",
  "volunteer_admin",
  "volunteer",
  "user",
];

export function UserManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = useState("");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: api.listUsers,
  });

  const { data: communities = [], isLoading: isLoadingCommunities } = useQuery({
    queryKey: ["communities"],
    queryFn: api.listCommunities,
  });

  const { data: sports = [], isLoading: isLoadingSports } = useQuery({
    queryKey: ["sports"],
    queryFn: () => api.listSports(),
  });

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: "volunteer",
      communityId: undefined,
      sportId: undefined,
    },
  });


  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => {
      if (!data.password || data.password === "***") {
        throw new Error("Password is required for new users");
      }
      const userData: Omit<User, "id"> & { password: string } = {
        username: data.username,
        email: data.email || undefined,
        password: data.password,
        role: data.role,
        communityId: data.communityId || undefined,
        sportId: data.sportId || undefined,
      };
      return api.createUser(userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDialogOpen(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (usersToDelete: User[]) => {
      await Promise.all(usersToDelete.map((user) => api.deleteUser(user.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setBulkDeleteDialogOpen(false);
      setBulkDeleteConfirmText("");
    },
  });

  const handleOpenDialog = () => {
    form.reset({
      username: "",
      email: "",
      password: "",
      role: "volunteer",
      communityId: undefined,
      sportId: undefined,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (data: UserFormData) => {
    createMutation.mutate(data);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
  };

  const roleCounts = users.reduce((counts, user) => {
    counts[user.role] = (counts[user.role] ?? 0) + 1;
    return counts;
  }, {} as Record<User["role"], number>);

  const filteredUsers = users.filter((user) => {
    if (roleFilter === "all") return true;
    return user.role === roleFilter;
  });
  const canBulkDelete = filteredUsers.length > 0 && !isLoadingUsers;
  const isBulkDeleteConfirmed = bulkDeleteConfirmText === "delete all";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Participants Management</h2>
        <div className="flex items-center gap-2">
          <ExportButton
            onExportCSV={() => api.exportParticipants("csv")}
            onExportExcel={() => api.exportParticipants("excel")}
            disabled={isLoadingUsers || isLoadingCommunities || isLoadingSports}
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new user.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input id="username" {...form.register("username")} placeholder="Username" />
                {form.formState.errors.username && (
                  <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} placeholder="user@example.com" />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  placeholder="Password"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={form.watch("role")}
                  onValueChange={(value) => form.setValue("role", value as "admin" | "community_admin" | "sports_admin" | "sports_super_admin" | "volunteer_admin" | "volunteer" | "user")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="community_admin">Community Admin</SelectItem>
                    <SelectItem value="sports_admin">Sports Rep (per sport)</SelectItem>
                    <SelectItem value="sports_super_admin">Sports Super Admin (all sports)</SelectItem>
                    <SelectItem value="volunteer_admin">Volunteer Admin</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="communityId">Community</Label>
                  <Select
                    value={form.watch("communityId") || "none"}
                    onValueChange={(value) => form.setValue("communityId", value === "none" ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a community" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {communities.map((comm) => (
                        <SelectItem key={comm.id} value={comm.id}>
                          {comm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sportId">Sport</Label>
                  <SportSelect
                    value={form.watch("sportId") || "none"}
                    onValueChange={(value) => form.setValue("sportId", value === "none" ? undefined : value)}
                    placeholder="Select a sport"
                    includeNoneOption={true}
                    noneOptionLabel="None"
                    noneOptionValue="none"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  Create
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
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>
                <div className="flex">
                  <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
                    <SelectTrigger className="h-8 w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles ({users.length})</SelectItem>
                      {roleFilterOptions.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role} ({roleCounts[role] ?? 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TableHead>
              <TableHead>Community</TableHead>
              <TableHead>Sport</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span>Actions</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canBulkDelete}>
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open actions menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground"
                        disabled={!canBulkDelete}
                        onSelect={() => setBulkDeleteDialogOpen(true)}
                      >
                        Delete all
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingUsers || isLoadingCommunities || isLoadingSports ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {roleFilter === "all"
                    ? "No users found. Create one to get started."
                    : "No users found for the selected role."}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const communityName = communities.find((c) => c.id === user.communityId)?.name || "-";
                const getSportName = (sportId?: string) => {
                  if (!sportId) return "-";
                  const sport = sports.find((s) => s.id === sportId);
                  if (!sport) return "-";
                  if (sport.parentId) {
                    const parent = sports.find((s) => s.id === sport.parentId);
                    return parent ? `${parent.name} - ${sport.name}` : sport.name;
                  }
                  return sport.name;
                };
                const sportName = getSportName(user.sportId);
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email || "-"}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>{communityName}</TableCell>
                    <TableCell>{sportName}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(user as any)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
              This action cannot be undone. This will permanently delete the user "
              {userToDelete?.username}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={(open) => {
          setBulkDeleteDialogOpen(open);
          if (!open) {
            setBulkDeleteConfirmText("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all visible users?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {filteredUsers.length} user
              {filteredUsers.length === 1 ? "" : "s"} currently shown in this table
              {roleFilter === "all" ? "." : ` for the "${roleFilter}" role filter.`} Type{" "}
              <span className="font-semibold text-foreground">delete all</span> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={bulkDeleteConfirmText}
            onChange={(event) => setBulkDeleteConfirmText(event.target.value)}
            placeholder="delete all"
            disabled={bulkDeleteMutation.isPending}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMutation.mutate(filteredUsers)}
              disabled={bulkDeleteMutation.isPending || filteredUsers.length === 0 || !isBulkDeleteConfirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

