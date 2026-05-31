import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useAuth } from "@/hooks/api/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Save, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const communityUpdateSchema = z.object({
  name: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string()
    .optional()
    .refine((val) => !val || val.trim() === "" || /^[\d\s\-\+\(\)]+$/.test(val), {
      message: "Phone number can only contain digits, spaces, hyphens, plus, and parentheses",
    }),
  email: z.string()
    .email("Invalid email address")
    .optional(),
  active: z.boolean().optional(),
});

type CommunityUpdateFormData = z.infer<typeof communityUpdateSchema>;

export function CommunityDetailView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: community } = useQuery({
    queryKey: ["community", user?.communityId],
    queryFn: () => user?.communityId ? api.getCommunity(user.communityId) : null,
    enabled: !!user?.communityId,
  });

  const { data: participants = [], isLoading: isLoadingParticipants } = useQuery({
    queryKey: ["participants"],
    queryFn: api.listParticipants,
    enabled: !!user?.communityId,
  });

  const communityCounts = useMemo(
    () => ({
      registered: participants.length,
      accepted: participants.filter((p) => p.status === "accepted").length,
    }),
    [participants]
  );

  const form = useForm<CommunityUpdateFormData>({
    resolver: zodResolver(communityUpdateSchema),
  });

  useEffect(() => {
    if (community && !isEditing) {
      form.reset({
        name: community.name || "",
        contactPerson: community.contactPerson || "",
        phone: community.phone || "",
        email: community.email || "",
        active: community.active ?? true,
      });
    }
  }, [community, isEditing, form]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CommunityUpdateFormData> }) => {
      return api.updateCommunity(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", user?.communityId] });
      setIsEditing(false);
    },
  });

  if (!community) {
    return <div className="text-center text-muted-foreground">No community assigned to your account.</div>;
  }

  const handleSave = (data: CommunityUpdateFormData) => {
    const { name: _name, ...updateData } = data;
    updateMutation.mutate({ id: community.id, data: updateData });
  };

  const handleCancel = () => {
    form.reset({
      name: community.name || "",
      contactPerson: community.contactPerson || "",
      phone: community.phone || "",
      email: community.email || "",
      active: community.active ?? true,
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {isLoadingParticipants ? (
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium leading-snug min-h-[2.75rem]">
                Registered Participants
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold tabular-nums leading-none">{communityCounts.registered}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium leading-snug min-h-[2.75rem]">
                Accepted Participants
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold tabular-nums leading-none">{communityCounts.accepted}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{community.name} - Details</CardTitle>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button type="button" onClick={form.handleSubmit(handleSave)} size="sm" disabled={updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button type="button" onClick={handleCancel} variant="outline" size="sm">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Community Name</Label>
                <Input
                  id="name"
                  value={community.name || "Not set"}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Input id="status" value={community.active ? "Active" : "Inactive"} disabled className="bg-muted" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                {isEditing ? (
                  <Input id="contactPerson" {...form.register("contactPerson")} placeholder="Contact Person" />
                ) : (
                  <Input value={community.contactPerson || "Not set"} disabled className="bg-muted" />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                {isEditing ? (
                  <>
                    <Input id="phone" {...form.register("phone")} placeholder="Phone" />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                    )}
                  </>
                ) : (
                  <Input value={community.phone || "Not set"} disabled className="bg-muted" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <>
                  <Input id="email" type="email" {...form.register("email")} placeholder="Email" />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </>
              ) : (
                <Input value={community.email || "Not set"} disabled className="bg-muted" />
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

