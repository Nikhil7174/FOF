import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useAuth } from "@/hooks/api/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Trash2, Upload, Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/ui/export-button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { BulkUploadResult } from "@/types";

export function CommunityParticipantsTable() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<{ open: boolean; participantId: string | null }>({ open: false, participantId: null });
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { data: participants = [], isLoading: isLoadingParticipants } = useQuery({
    queryKey: ["participants"],
    queryFn: api.listParticipants,
  });

  const { data: sports = [], isLoading: isLoadingSports } = useQuery({
    queryKey: ["sports"],
    queryFn: api.listSports,
  });

  // Backend already filters by community for community_admin, so use participants directly
  const communityParticipants = participants;
  
  // Debug logging to help troubleshoot
  if (user?.role === "community_admin") {
    console.log("[CommunityParticipantsTable] Debug:", {
      userCommunityId: user.communityId,
      totalParticipants: participants.length,
      participants: participants.map((p: any) => ({
        id: p.id,
        email: p.email,
        name: `${p.firstName} ${p.lastName}`,
        communityId: p.communityId,
        status: p.status,
      })),
    });
  }

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

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.bulkUploadParticipants(file),
    onSuccess: (result) => {
      setUploadResult(result);
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${result.successCount} participant(s). ${result.skippedCount} skipped, ${result.errorCount} errors.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error?.message || "Failed to upload participants. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.toLowerCase().split(".").pop();
      if (!["csv", "xlsx", "xls"].includes(ext || "")) {
        toast({
          title: "Invalid File",
          description: "Please select a CSV or Excel file (.csv, .xlsx, .xls)",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    uploadMutation.mutate(selectedFile);
  };

  const handleDownloadTemplate = () => {
    if (!sports || sports.length === 0) {
      toast({
        title: "Sports list not ready",
        description: "Please wait for sports to load, then try again.",
      });
      return;
    }

    // All registration fields with * for required fields
    const headers = [
      "firstName *",
      "lastName *", 
      "middleName",
      "email *",
      "phone *",
      "dob *",
      "gender *",
      "username *",
      "password *",
      "nextOfKinFirstName *",
      "nextOfKinLastName *",
      "nextOfKinMiddleName",
      "nextOfKinPhone *",
      "paymentDetails *",
      "sports *",
      "community *"
    ];
    
    // Example row with sample data
    const exampleRow = [
      "John",
      "Doe",
      "Michael",
      "john.doe@example.com",
      "+254712345678",
      "1990-01-15",
      "male",
      "johndoe",
      "SecurePass123",
      "Jane",
      "Doe",
      "Marie",
      "+254700000000",
      "Payment via M-Pesa, Transaction ID: ABC123XYZ",
      "Football, Basketball, Athletics - 100m Sprint",
      "Nairobi Central"
    ];
    
    // Second example row showing optional fields can be empty
    const exampleRow2 = [
      "Ahmed",
      "Hassan",
      "",
      "ahmed.hassan@example.com",
      "+254723456789",
      "1992-05-20",
      "male",
      "ahmedhassan",
      "MyPassword123",
      "Fatuma",
      "Hassan",
      "",
      "+254711111111",
      "Payment confirmed via bank transfer, Ref: BANK123",
      "Swimming, Athletics - Long Jump",
      "Nairobi Central"
    ];
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    
    // Prepare data array
    const data = [
      headers,
      exampleRow,
      exampleRow2,
    ];
    
    // Create worksheet from data
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths for better readability
    const colWidths = [
      { wch: 15 }, // firstName
      { wch: 15 }, // lastName
      { wch: 15 }, // middleName
      { wch: 25 }, // email
      { wch: 18 }, // phone
      { wch: 12 }, // dob
      { wch: 10 }, // gender
      { wch: 15 }, // username
      { wch: 15 }, // password
      { wch: 20 }, // nextOfKinFirstName
      { wch: 20 }, // nextOfKinLastName
      { wch: 20 }, // nextOfKinMiddleName
      { wch: 18 }, // nextOfKinPhone
      { wch: 40 }, // paymentDetails
      { wch: 30 }, // sports
      { wch: 20 }, // community
    ];
    worksheet["!cols"] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Participants Template");
    
    // Create a second sheet with instructions
    const instructionsData = [
      ["FIELD DESCRIPTIONS"],
      [""],
      ["REQUIRED FIELDS (marked with * - Must be filled):"],
      ["- firstName *: Participant's first name"],
      ["- lastName *: Participant's last name"],
      ["- email *: Valid email address (must be unique in system)"],
      ["- phone *: Phone number (any format accepted)"],
      ["- dob *: Date of birth (formats: YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY)"],
      ["- gender *: Must be exactly 'male' or 'female'"],
      ["- username *: Username for login (must be unique, 3-30 characters)"],
      ["- password *: Password for login (minimum 6 characters)"],
      ["- nextOfKinFirstName *: Next of kin's first name"],
      ["- nextOfKinLastName *: Next of kin's last name"],
      ["- nextOfKinPhone *: Next of kin's phone number"],
      ["- paymentDetails *: Payment details or other registration notes"],
      ["- sports *: At least one sport required. Comma-separated list of sport names (see 'Sports Reference' sheet)"],
      ["- community *: Community name (must be specified)"],
      [""],
      ["OPTIONAL FIELDS (Can be left empty):"],
      ["- middleName: Participant's middle name"],
      ["- nextOfKinMiddleName: Next of kin's middle name"],
      [""],
      ["IMPORTANT NOTES:"],
      ["- All uploaded participants are automatically ACCEPTED (no manual approval needed)"],
      ["- Duplicate usernames will be SKIPPED (emails can repeat)"],
      ["- Community is automatically set to your community (no need to specify)"],
      ["- Date formats: Use YYYY-MM-DD (recommended), DD/MM/YYYY, or MM/DD/YYYY"],
      ["- Sports Format (also see 'Sports Reference' sheet):"],
      ["  * For sports with subcategories: Use 'Parent Name - Child Name'"],
      ["    Example: 'Athletics - 100m Sprint', 'Athletics - Long Jump'"],
      ["  * For sports without subcategories: Use just the sport name"],
      ["    Example: 'Football', 'Basketball'"],
      ["  * If a child sport name is unique, you can use just the child name"],
      ["  * Multiple sports: Separate with commas (e.g., 'Football, Athletics - 100m Sprint, Swimming')"],
      ["- Username: Must be 3-30 characters, letters, numbers, underscores, hyphens, or dots"],
      ["- Password: Minimum 6 characters required"],
      ["- Community: Must match an existing community name in the system"],
      [""],
      ["BULK UPLOAD LIMITATIONS:"],
      ["- Currently processes: firstName, lastName, middleName, email, phone, dob, gender, username, password"],
      ["- Additional fields (nextOfKin, paymentDetails, sports, community) are included for reference"],
      ["- These additional fields can be added/edited after upload through the participant management interface"],
    ];
    
    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    instructionsSheet["!cols"] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

    // Create sports reference sheet using live data
    const sportsReferenceHeader = ["Sport Category", "Selectable Name"];
    const sportsReferenceRows = [sportsReferenceHeader];

    const parentSports = sports.filter((sport: any) => !sport.parentId);
    parentSports.sort((a: any, b: any) => a.name.localeCompare(b.name));

    parentSports.forEach((parent: any) => {
      const childSports = sports
        .filter((sport: any) => sport.parentId === parent.id)
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      if (childSports.length === 0) {
        sportsReferenceRows.push(["-", parent.name]);
      } else {
        sportsReferenceRows.push([parent.name, "(Parent Category - not selectable)"]);
        childSports.forEach((child: any) => {
          sportsReferenceRows.push([
            parent.name,
            `${parent.name} - ${child.name}`,
          ]);
        });
      }
    });

    const sportsSheet = XLSX.utils.aoa_to_sheet(sportsReferenceRows);
    sportsSheet["!cols"] = [{ wch: 30 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, sportsSheet, "Sports Reference");
    
    // Generate Excel file and download
    XLSX.writeFile(workbook, "participants-template.xlsx");
  };

  const handleAccept = (id: string) => {
    updateStatusMutation.mutate({ id, status: "accepted" });
  };

  const handleReject = (id: string) => {
    updateStatusMutation.mutate({ id, status: "rejected" });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const getSportsForParticipant = (participantSports: any[], pendingSports?: string[] | null) => {
    // If there are pending sports, show those instead
    if (pendingSports && Array.isArray(pendingSports) && pendingSports.length > 0) {
      return pendingSports
        .map((id) => {
          const sport = sports.find((s: any) => s.id === id);
          if (!sport) return null;
          // If it's a child sport, show parent - child format
          if (sport.parentId) {
            const parent = sports.find((s: any) => s.id === sport.parentId);
            return parent ? `${parent.name} - ${sport.name}` : sport.name;
          }
          return sport.name;
        })
        .filter(Boolean);
    }

    // Handle both formats: array of IDs or array of ParticipantSport objects
    if (!participantSports || participantSports.length === 0) return [];
    
    // Check if it's an array of objects with sport property (from API)
    if (participantSports[0]?.sport) {
      return participantSports.map((ps: any) => {
        const sport = ps.sport;
        if (!sport) return null;
        // If it's a child sport, show parent - child format
        if (sport.parentId) {
          const parent = sports.find((s: any) => s.id === sport.parentId);
          return parent ? `${parent.name} - ${sport.name}` : sport.name;
        }
        return sport.name;
      }).filter(Boolean);
    }
    
    // Otherwise, treat as array of sport IDs
    return participantSports
      .map((id) => {
        const sport = sports.find((s: any) => s.id === id);
        if (!sport) return null;
        // If it's a child sport, show parent - child format
        if (sport.parentId) {
          const parent = sports.find((s: any) => s.id === sport.parentId);
          return parent ? `${parent.name} - ${sport.name}` : sport.name;
        }
        return sport.name;
      })
      .filter(Boolean);
  };

  const isLoading = isLoadingParticipants || isLoadingSports;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Participants ({communityParticipants.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUploadDialogOpen(true)}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
            <ExportButton
              onExportCSV={() => api.exportParticipants("csv")}
              onExportExcel={() => api.exportParticipants("excel")}
              disabled={isLoading}
            />
          </div>
        </div>
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
                <TableHead>Payment Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : communityParticipants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No participants registered for this community yet.
                  </TableCell>
                </TableRow>
              ) : (
                communityParticipants.map((p: any) => {
                  const hasPendingSports = p.pendingSports && Array.isArray(p.pendingSports) && p.pendingSports.length > 0;
                  const participantSports = getSportsForParticipant(p.sports || [], p.pendingSports);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.firstName} {p.middleName ? p.middleName + " " : ""}{p.lastName}
                      </TableCell>
                      <TableCell>{p.email}</TableCell>
                      <TableCell>{p.phone}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {hasPendingSports && (
                            <div className="text-xs text-muted-foreground mb-1">
                              <Badge variant="outline" className="text-orange-600 border-orange-300">
                                Pending Changes
                              </Badge>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1">
                            {participantSports.length > 0 ? (
                              participantSports.map((sportName, idx) => (
                                <Badge key={idx} variant={hasPendingSports ? "default" : "secondary"}>
                                  {sportName}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {p.notes ? (
                          <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">{p.notes}</p>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
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

      <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
        setUploadDialogOpen(open);
        if (!open) {
          setSelectedFile(null);
          setUploadResult(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Upload Participants</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to bulk import participants. All uploaded participants will be automatically accepted.
            </DialogDescription>
          </DialogHeader>

          {!uploadResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select File</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Supported formats: CSV, Excel (.xlsx, .xls).
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{uploadResult.successCount}</div>
                  <div className="text-sm text-muted-foreground">Successfully Uploaded</div>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{uploadResult.skippedCount}</div>
                  <div className="text-sm text-muted-foreground">Skipped</div>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{uploadResult.errorCount}</div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
              </div>

              {uploadResult.skipped.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Skipped Participants:</h4>
                  <div className="max-h-32 overflow-y-auto border rounded p-2">
                    {uploadResult.skipped.map((item, idx) => (
                      <div key={idx} className="text-sm py-1">
                        Row {item.row}: {item.email} - {item.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Errors:</h4>
                  <div className="max-h-48 overflow-y-auto border rounded p-2">
                    {uploadResult.errors.map((item, idx) => (
                      <div key={idx} className="text-sm py-1 border-b last:border-b-0">
                        <div className="font-medium">Row {item.row}: {item.email || "No email"}</div>
                        <ul className="list-disc list-inside ml-2 text-muted-foreground">
                          {item.errors.map((error, errIdx) => (
                            <li key={errIdx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {!uploadResult ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setUploadDialogOpen(false)}
                  disabled={uploadMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => {
                setUploadDialogOpen(false);
                setSelectedFile(null);
                setUploadResult(null);
              }}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}



