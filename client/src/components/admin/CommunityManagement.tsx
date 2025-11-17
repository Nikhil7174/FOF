import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { CommunityRecord, CommunityContact } from "@/types";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const usernamePattern = /^[a-zA-Z0-9_.-]{3,30}$/;

const communitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  active: z.boolean(),
  contactPerson: z.string().min(1, "Contact person is required"),
  phone: z.string()
    .min(1, "Phone is required")
    .refine((val) => /^[\d\s\-\+\(\)]+$/.test(val), {
      message: "Phone number can only contain digits, spaces, hyphens, plus, and parentheses",
    }),
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z.string().optional(),
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
});

type CommunityFormData = z.infer<typeof communitySchema>;

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string()
    .min(1, "Phone is required")
    .refine((val) => /^[\d\s\-\+\(\)]+$/.test(val), {
      message: "Phone number can only contain digits, spaces, hyphens, plus, and parentheses",
    }),
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email address"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function CommunityManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<CommunityRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [communityToDelete, setCommunityToDelete] = useState<CommunityRecord | null>(null);
  const [contactsDialogOpen, setContactsDialogOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityRecord | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CommunityContact | null>(null);
  const [deleteContactDialogOpen, setDeleteContactDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<CommunityContact | null>(null);
  const queryClient = useQueryClient();

  const { data: communities = [] } = useQuery({
    queryKey: ["communities"],
    queryFn: api.listCommunities,
  });

  const form = useForm<CommunityFormData>({
    resolver: zodResolver(communitySchema),
    defaultValues: {
      name: "",
      active: true,
      contactPerson: "",
      phone: "",
      email: "",
      password: "",
      adminUsername: "",
      adminEmail: "",
      adminPassword: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CommunityFormData) => {
      console.log("Create mutation called with data:", data);
      if (!data.password || data.password === "***" || data.password.trim() === "") {
        // Set form error for password field
        form.setError("password", {
          type: "manual",
          message: "Password is required for new communities",
        });
        throw new Error("Password is required for new communities");
      }
      const trimmedAdminUsername = data.adminUsername?.trim() || "";
      const trimmedAdminEmail = data.adminEmail?.trim() || "";
      const payload = {
        ...data,
        adminUsername: trimmedAdminUsername.length > 0 ? trimmedAdminUsername : null,
        adminEmail: trimmedAdminEmail.length > 0 ? trimmedAdminEmail : null,
        adminPassword: data.adminPassword?.trim() && data.adminPassword.trim().length > 0 ? data.adminPassword.trim() : undefined,
      };
      return api.createCommunity(payload as any);
    },
    onSuccess: () => {
      console.log("Community created successfully");
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error("Error creating community:", error);
      const errorMessage = error?.message || error?.error || "Unknown error";
      
      // If it's a password error, the form error is already set
      if (errorMessage.includes("Password")) {
        // Error already set in form, just show alert
        alert(`Error: ${errorMessage}`);
      } else {
        // For other errors, show alert
        alert(`Error creating community: ${errorMessage}`);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CommunityFormData> }) => {
      // Only include password in update if it's provided and not the masked value
      const updateData = { ...data };
      if (data.password === "***" || !data.password) {
        delete updateData.password;
      }
      // Only include adminPassword in update if it's provided and not the masked value
      if (data.adminPassword === "***" || !data.adminPassword) {
        delete updateData.adminPassword;
      }
      if (data.adminUsername !== undefined) {
        const trimmed = data.adminUsername?.trim() || "";
        updateData.adminUsername = trimmed.length > 0 ? trimmed : null;
      }
      if (data.adminEmail !== undefined) {
        const trimmed = data.adminEmail?.trim() || "";
        updateData.adminEmail = trimmed.length > 0 ? trimmed : null;
      }
      return api.updateCommunity(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      setDialogOpen(false);
      setEditingCommunity(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCommunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      setDeleteDialogOpen(false);
      setCommunityToDelete(null);
    },
  });

  const handleOpenDialog = (community?: CommunityRecord) => {
    if (community) {
      setEditingCommunity(community);
      form.reset({
        name: community.name,
        active: community.active,
        contactPerson: community.contactPerson,
        phone: community.phone,
        email: community.email,
        password: "***", // Mask existing password
        adminUsername: community.adminUsername ?? "",
        adminEmail: community.adminEmail ?? "",
        adminPassword: community.adminPassword ? "***" : "", // Mask existing password
      });
    } else {
      setEditingCommunity(null);
      form.reset();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (data: CommunityFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    console.log("Editing community:", editingCommunity);
    
    // Validate password for new communities before submitting
    if (!editingCommunity) {
      if (!data.password || data.password.trim() === "") {
        form.setError("password", {
          type: "manual",
          message: "Password is required for new communities",
        });
        return; // Don't proceed with mutation
      }
    }
    
    const trimmedAdminUsername = data.adminUsername?.trim() || "";
    const adminUsernameChanged = trimmedAdminUsername !== (editingCommunity?.adminUsername ?? "");
    if (trimmedAdminUsername && (!data.adminPassword || data.adminPassword === "***" || data.adminPassword.trim() === "")) {
      if (!editingCommunity || adminUsernameChanged) {
        form.setError("adminPassword", {
          type: "manual",
          message: "Admin password is required when assigning a username",
        });
        return;
      }
    }

    const submission: CommunityFormData = {
      ...data,
      adminUsername: trimmedAdminUsername,
      adminEmail: data.adminEmail?.trim() || "",
    };

    if (editingCommunity) {
      console.log("Calling update mutation");
      updateMutation.mutate({ id: editingCommunity.id, data: submission });
    } else {
      console.log("Calling create mutation");
      createMutation.mutate(submission);
    }
  };

  const handleSubmitError = (errors: any) => {
    console.log("Form validation errors:", errors);
    console.log("Form state errors:", form.formState.errors);
    // Show alert with validation errors
    const errorMessages = Object.entries(errors || {})
      .map(([field, error]: [string, any]) => `${field}: ${error?.message || "Invalid"}`)
      .join("\n");
    if (errorMessages) {
      alert(`Form validation failed:\n${errorMessages}`);
    }
  };

  const handleDelete = (community: CommunityRecord) => {
    setCommunityToDelete(community);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (communityToDelete) {
      deleteMutation.mutate(communityToDelete.id);
    }
  };

  // Contact management
  const { data: contacts = [] } = useQuery({
    queryKey: ["community-contacts", selectedCommunity?.id],
    queryFn: () => selectedCommunity ? api.listCommunityContacts(selectedCommunity.id) : [],
    enabled: !!selectedCommunity,
  });

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
    },
  });

  const createContactMutation = useMutation({
    mutationFn: (data: ContactFormData) => {
      if (!selectedCommunity) throw new Error("No community selected");
      return api.createCommunityContact(selectedCommunity.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-contacts", selectedCommunity?.id] });
      setContactDialogOpen(false);
      contactForm.reset();
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContactFormData> }) => {
      return api.updateCommunityContact(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-contacts", selectedCommunity?.id] });
      setContactDialogOpen(false);
      setEditingContact(null);
      contactForm.reset();
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => api.deleteCommunityContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-contacts", selectedCommunity?.id] });
      setDeleteContactDialogOpen(false);
      setContactToDelete(null);
    },
  });

  const handleOpenContactsDialog = (community: CommunityRecord) => {
    setSelectedCommunity(community);
    setContactsDialogOpen(true);
  };

  const handleOpenContactDialog = (contact?: CommunityContact) => {
    if (contact) {
      setEditingContact(contact);
      contactForm.reset({
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
      });
    } else {
      setEditingContact(null);
      contactForm.reset();
    }
    setContactDialogOpen(true);
  };

  const handleSubmitContact = (data: ContactFormData) => {
    if (editingContact) {
      updateContactMutation.mutate({ id: editingContact.id, data });
    } else {
      createContactMutation.mutate(data);
    }
  };

  const handleDeleteContact = (contact: CommunityContact) => {
    setContactToDelete(contact);
    setDeleteContactDialogOpen(true);
  };

  const confirmDeleteContact = () => {
    if (contactToDelete) {
      deleteContactMutation.mutate(contactToDelete.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Communities Management</h2>
        <div className="flex gap-2">
          <ExportButton
            onExportCSV={() => api.exportCommunities("csv")}
            onExportExcel={() => api.exportCommunities("excel")}
            disabled={false}
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Community
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCommunity ? "Edit Community" : "Create New Community"}
              </DialogTitle>
              <DialogDescription>
                {editingCommunity
                  ? "Update the community details below."
                  : "Fill in the details to create a new community."}
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
              <div className="space-y-2">
                <Label htmlFor="name">Community Name *</Label>
                <Input id="name" {...form.register("name")} placeholder="Community name" />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person *</Label>
                <Input id="contactPerson" {...form.register("contactPerson")} placeholder="Contact person" />
                {form.formState.errors.contactPerson && (
                  <p className="text-sm text-destructive">{form.formState.errors.contactPerson.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" {...form.register("phone")} placeholder="Phone" />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" {...form.register("email")} placeholder="Email" />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {editingCommunity && "(leave blank to keep current)"} *
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  placeholder={editingCommunity ? "Leave blank to keep current" : "Password"}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-4 border-t pt-4">
                <Label className="text-base font-semibold">Community Admin Credentials</Label>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                <Label htmlFor="adminUsername">Admin Username</Label>
                <Input
                  id="adminUsername"
                  {...form.register("adminUsername")}
                  placeholder="community_admin"
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
                    <Input id="adminEmail" type="email" {...form.register("adminEmail")} placeholder="admin@community.com" />
                    {form.formState.errors.adminEmail && (
                      <p className="text-sm text-destructive">{form.formState.errors.adminEmail.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">
                      Admin Password {editingCommunity && "(leave blank to keep current)"}
                    </Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      {...form.register("adminPassword")}
                      placeholder={editingCommunity ? "Leave blank to keep current" : "Password for community admin"}
                    />
                    {form.formState.errors.adminPassword && (
                      <p className="text-sm text-destructive">{form.formState.errors.adminPassword.message}</p>
                    )}
                  </div>
                </div>
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
                  {editingCommunity ? "Update" : "Create"}
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
              <TableHead>Contact Person</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {communities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No communities found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              communities.map((community) => (
                <TableRow key={community.id}>
                  <TableCell className="font-medium">{community.name}</TableCell>
                  <TableCell>{community.contactPerson}</TableCell>
                  <TableCell>{community.phone}</TableCell>
                  <TableCell>{community.email}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        community.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {community.active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenContactsDialog(community)}
                        title="Manage Contacts"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(community)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(community)}
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
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the community "
              {communityToDelete?.name}".
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

      {/* Contacts Management Dialog */}
      <Dialog open={contactsDialogOpen} onOpenChange={setContactsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Contacts - {selectedCommunity?.name}</DialogTitle>
            <DialogDescription>
              Add, edit, or remove contact persons for this community.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => handleOpenContactDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No contacts found. Add one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell>{contact.phone}</TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenContactDialog(contact)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteContact(contact)}
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
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContact ? "Edit Contact" : "Add New Contact"}</DialogTitle>
            <DialogDescription>
              {editingContact ? "Update the contact details below." : "Fill in the details to add a new contact."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={contactForm.handleSubmit(handleSubmitContact)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name *</Label>
              <Input id="contact-name" {...contactForm.register("name")} placeholder="Contact name" />
              {contactForm.formState.errors.name && (
                <p className="text-sm text-destructive">{contactForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone *</Label>
              <Input id="contact-phone" {...contactForm.register("phone")} placeholder="Phone number" />
              {contactForm.formState.errors.phone && (
                <p className="text-sm text-destructive">{contactForm.formState.errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email *</Label>
              <Input id="contact-email" type="email" {...contactForm.register("email")} placeholder="Email address" />
              {contactForm.formState.errors.email && (
                <p className="text-sm text-destructive">{contactForm.formState.errors.email.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setContactDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createContactMutation.isPending || updateContactMutation.isPending}>
                {editingContact ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Dialog */}
      <AlertDialog open={deleteContactDialogOpen} onOpenChange={setDeleteContactDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the contact "{contactToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteContact}
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

