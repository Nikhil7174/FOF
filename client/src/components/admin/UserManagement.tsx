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

const userSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address").optional(),
  password: z.string().optional(),
  role: z.enum(["admin", "community_admin", "sports_admin", "volunteer_admin", "volunteer", "user"]),
  communityId: z.string().optional(),
  sportId: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

export function UserManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
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
    queryFn: api.listSports,
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
      const userData: Omit<User, "id"> = {
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserFormData> }) => {
      const userData: Partial<Omit<User, "id">> = {};
      if (data.username !== undefined) userData.username = data.username;
      if (data.email !== undefined) userData.email = data.email || undefined;
      if (data.password !== undefined && data.password !== "***") {
        userData.password = data.password;
      }
      if (data.role !== undefined) userData.role = data.role;
      if (data.communityId !== undefined) userData.communityId = data.communityId || undefined;
      if (data.sportId !== undefined) userData.sportId = data.sportId || undefined;
      return api.updateUser(id, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDialogOpen(false);
      setEditingUser(null);
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

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      form.reset({
        username: user.username,
        email: user.email || "",
        password: "***",
        role: user.role,
        communityId: user.communityId || undefined,
        sportId: user.sportId || undefined,
      });
    } else {
      setEditingUser(null);
      form.reset({
        username: "",
        email: "",
        password: "",
        role: "volunteer",
        communityId: undefined,
        sportId: undefined,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = (data: UserFormData) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(data);
    }
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Users Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
              <DialogDescription>
                {editingUser ? "Update the user details below." : "Fill in the details to create a new user."}
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
                <Label htmlFor="password">
                  Password {editingUser && "(leave blank to keep current)"} *
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  placeholder={editingUser ? "Leave blank to keep current" : "Password"}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={form.watch("role")}
                  onValueChange={(value) => form.setValue("role", value as "admin" | "community_admin" | "sports_admin" | "volunteer_admin" | "volunteer" | "user")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="community_admin">Community Admin</SelectItem>
                    <SelectItem value="sports_admin">Sports Admin</SelectItem>
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
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingUser ? "Update" : "Create"}
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
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Community</TableHead>
              <TableHead>Sport</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No users found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(user as any)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(user as any)}>
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
    </div>
  );
}

