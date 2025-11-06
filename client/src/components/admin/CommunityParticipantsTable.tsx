import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useAuth } from "@/hooks/api/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Check, X, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function CommunityParticipantsTable() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<{ open: boolean; participantId: string | null }>({ open: false, participantId: null });
  
  const { data: participants = [] } = useQuery({
    queryKey: ["participants"],
    queryFn: api.listParticipants,
  });

  const { data: sports = [] } = useQuery({
    queryKey: ["sports"],
    queryFn: api.listSports,
  });

  const communityParticipants = participants.filter((p: any) => p.communityId === user?.communityId);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "accepted" | "rejected" }) =>
      api.setParticipantStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteParticipant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      setDeleteDialogOpen({ open: false, participantId: null });
    },
  });

  const handleAccept = (id: string) => {
    updateStatusMutation.mutate({ id, status: "accepted" });
  };

  const handleReject = (id: string) => {
    updateStatusMutation.mutate({ id, status: "rejected" });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const getSportsForParticipant = (sportIds: string[]) => {
    return sportIds
      .map((id) => sports.find((s: any) => s.id === id))
      .filter(Boolean)
      .map((s: any) => s.name);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants ({communityParticipants.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Sports</TableHead>
                <TableHead>Team Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {communityParticipants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No participants registered for this community yet.
                  </TableCell>
                </TableRow>
              ) : (
                communityParticipants.map((p: any) => {
                  const participantSports = getSportsForParticipant(p.sports || []);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.firstName} {p.middleName ? p.middleName + " " : ""}{p.lastName}
                      </TableCell>
                      <TableCell>{p.email}</TableCell>
                      <TableCell>{p.phone}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {participantSports.length > 0 ? (
                            participantSports.map((sportName, idx) => (
                              <Badge key={idx} variant="secondary">
                                {sportName}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{p.teamName || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            p.status === "accepted"
                              ? "bg-green-100 text-green-800"
                              : p.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {p.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {p.status === "pending" ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAccept(p.id)}
                                disabled={updateStatusMutation.isPending}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(p.id)}
                                disabled={updateStatusMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          ) : (
                            <AlertDialog open={deleteDialogOpen.open && deleteDialogOpen.participantId === p.id} onOpenChange={(open) => setDeleteDialogOpen({ open, participantId: open ? p.id : null })}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={deleteMutation.isPending}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Participant</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {p.firstName} {p.lastName}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setDeleteDialogOpen({ open: false, participantId: null })}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(p.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={deleteMutation.isPending}
                                  >
                                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

