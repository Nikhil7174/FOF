import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { LeaderboardRanking, SportLeaderboardEntry, SportRecord, CommunityRecord } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SportSelect } from "@/components/ui/sport-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Trophy, Medal, Circle, Plus, Edit, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/api/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

export function Leaderboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: overallLeaderboard = [], isLoading: isLoadingOverall } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: api.getLeaderboard,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: sports = [] } = useQuery({
    queryKey: ["sports"],
    queryFn: api.listSports,
  });

  // Reset to page 1 when leaderboard data changes and current page is out of bounds
  React.useEffect(() => {
    if (overallLeaderboard.length > 0) {
      const totalPages = Math.ceil(overallLeaderboard.length / ITEMS_PER_PAGE);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(1);
      }
    }
  }, [overallLeaderboard.length, currentPage]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    } else if (rank === 2) {
      return <Medal className="h-5 w-5 text-gray-400" />;
    } else if (rank === 3) {
      return <Medal className="h-5 w-5 text-orange-600" />;
    }
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  // Pagination logic
  const totalPages = Math.ceil(overallLeaderboard.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedLeaderboard = overallLeaderboard.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Leaderboard</h2>
        <p className="text-muted-foreground">
          View rankings for overall standings and per-sport results
        </p>
      </div>

      <Tabs defaultValue="overall" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overall">Overall Leaderboard</TabsTrigger>
          <TabsTrigger value="per-sport">Per-Sport Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overall Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingOverall ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : overallLeaderboard.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No leaderboard data available yet.
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Rank</TableHead>
                        <TableHead>Community</TableHead>
                        <TableHead className="text-right">Total Score</TableHead>
                        <TableHead className="text-right">Sports Participated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLeaderboard.map((entry) => (
                        <TableRow key={entry.communityId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getRankBadge(entry.rank)}
                              <span className="font-semibold">{entry.rank}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{entry.communityName}</TableCell>
                          <TableCell className="text-right font-semibold text-lg">
                            {entry.totalScore}
                          </TableCell>
                          <TableCell className="text-right">{entry.entryCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {totalPages > 1 && (
                    <div className="mt-4">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="per-sport" className="space-y-4">
          <PerSportLeaderboard sports={sports} isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PerSportLeaderboard({ sports, isAdmin }: { sports: SportRecord[]; isAdmin: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSportId, setEditingSportId] = useState<string | null>(null);

  // Filter out child sports (subsports)
  const parentSports = sports.filter((sport) => !sport.parentId);

  const handleEditSport = (sportId: string) => {
    setEditingSportId(sportId);
    setDialogOpen(true);
  };

  const handleAddPoints = () => {
    setEditingSportId(null);
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sport Rankings</CardTitle>
            {isAdmin && (
              <Button onClick={handleAddPoints}>
                <Plus className="mr-2 h-4 w-4" />
                Add Points
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sport</TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span>1st Place</span>
                    </div>
                    <span className="text-xs text-muted-foreground">(10 points)</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <Medal className="h-4 w-4 text-gray-400" />
                      <span>2nd Place</span>
                    </div>
                    <span className="text-xs text-muted-foreground">(7 points)</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <Medal className="h-4 w-4 text-orange-600" />
                      <span>3rd Place</span>
                    </div>
                    <span className="text-xs text-muted-foreground">(5 points)</span>
                  </div>
                </TableHead>
                {isAdmin && <TableHead className="text-center">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {parentSports.map((sport) => (
                <SportLeaderboardRow
                  key={sport.id}
                  sportId={sport.id}
                  sportName={sport.name}
                  isAdmin={isAdmin}
                  onEdit={() => handleEditSport(sport.id)}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isAdmin && (
        <AddPointsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editingSportId={editingSportId}
          onClose={() => {
            setDialogOpen(false);
            setEditingSportId(null);
          }}
        />
      )}
    </>
  );
}

function SportLeaderboardRow({
  sportId,
  sportName,
  isAdmin,
  onEdit,
}: {
  sportId: string;
  sportName: string;
  isAdmin: boolean;
  onEdit: () => void;
}) {
  const { data: sportLeaderboard = [], isLoading } = useQuery({
    queryKey: ["leaderboard-sport", sportId],
    queryFn: () => api.getLeaderboardBySport(sportId),
    enabled: !!sportId,
  });

  const firstPlace = sportLeaderboard.find((entry) => entry.rank === 1);
  const secondPlace = sportLeaderboard.find((entry) => entry.rank === 2);
  const thirdPlace = sportLeaderboard.find((entry) => entry.rank === 3);

  if (isLoading) {
    return (
      <TableRow>
        <TableCell>
          <Skeleton className="h-5 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-32" />
        </TableCell>
        {isAdmin && (
          <TableCell>
            <Skeleton className="h-5 w-16" />
          </TableCell>
        )}
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{sportName}</TableCell>
      <TableCell className="text-center">
        {firstPlace ? (
          <span className="font-semibold">{firstPlace.communityName}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        {secondPlace ? (
          <span className="font-semibold">{secondPlace.communityName}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        {thirdPlace ? (
          <span className="font-semibold">{thirdPlace.communityName}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      {isAdmin && (
        <TableCell className="text-center">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}

function AddPointsDialog({
  open,
  onOpenChange,
  editingSportId,
  onClose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSportId: string | null;
  onClose: () => void;
}) {
  const [sportId, setSportId] = useState<string>("");
  const [firstPlaceId, setFirstPlaceId] = useState<string>("");
  const [secondPlaceId, setSecondPlaceId] = useState<string>("");
  const [thirdPlaceId, setThirdPlaceId] = useState<string>("");
  const [sportOpen, setSportOpen] = useState(false);
  const [firstOpen, setFirstOpen] = useState(false);
  const [secondOpen, setSecondOpen] = useState(false);
  const [thirdOpen, setThirdOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sports = [] } = useQuery({
    queryKey: ["sports"],
    queryFn: api.listSports,
  });

  const { data: communities = [] } = useQuery({
    queryKey: ["communities"],
    queryFn: api.listCommunities,
  });

  // Load existing data when editing
  const { data: existingLeaderboard = [] } = useQuery({
    queryKey: ["leaderboard-sport", editingSportId],
    queryFn: () => api.getLeaderboardBySport(editingSportId!),
    enabled: !!editingSportId && open,
  });

  const prevOpenRef = React.useRef(false);

  React.useEffect(() => {
    // Only run when dialog transitions from closed to open
    if (open && !prevOpenRef.current) {
      if (editingSportId) {
        // When editing, set the sport and load existing data
        setSportId(editingSportId);
        const first = existingLeaderboard.find((e) => e.rank === 1);
        const second = existingLeaderboard.find((e) => e.rank === 2);
        const third = existingLeaderboard.find((e) => e.rank === 3);
        setFirstPlaceId(first?.communityId || "");
        setSecondPlaceId(second?.communityId || "");
        setThirdPlaceId(third?.communityId || "");
      } else {
        // When adding new entry, reset form
        setSportId("");
        setFirstPlaceId("");
        setSecondPlaceId("");
        setThirdPlaceId("");
      }
    }
    prevOpenRef.current = open;
  }, [open, editingSportId, existingLeaderboard]);

  // Update form data when existingLeaderboard changes (for editing mode)
  React.useEffect(() => {
    if (editingSportId && open && existingLeaderboard.length > 0) {
      const first = existingLeaderboard.find((e) => e.rank === 1);
      const second = existingLeaderboard.find((e) => e.rank === 2);
      const third = existingLeaderboard.find((e) => e.rank === 3);
      setFirstPlaceId(first?.communityId || "");
      setSecondPlaceId(second?.communityId || "");
      setThirdPlaceId(third?.communityId || "");
    }
  }, [existingLeaderboard, editingSportId, open]);


  const createOrUpdateMutation = useMutation({
    mutationFn: async () => {
      if (!sportId) throw new Error("Please select a sport");

      const entries = [];
      const scores = { 1: 10, 2: 7, 3: 5 };
      const medals = { 1: "gold" as const, 2: "silver" as const, 3: "bronze" as const };

      if (firstPlaceId) {
        entries.push({
          communityId: firstPlaceId,
          sportId,
          score: scores[1],
          position: 1,
          medalType: medals[1],
        });
      }
      if (secondPlaceId) {
        entries.push({
          communityId: secondPlaceId,
          sportId,
          score: scores[2],
          position: 2,
          medalType: medals[2],
        });
      }
      if (thirdPlaceId) {
        entries.push({
          communityId: thirdPlaceId,
          sportId,
          score: scores[3],
          position: 3,
          medalType: medals[3],
        });
      }

      // Create or update each entry
      for (const entry of entries) {
        await api.createLeaderboardEntry(entry);
      }

      // Delete existing entries for this sport that are not in the new list
      const existingEntries = await api.getLeaderboardBySport(sportId);
      const newCommunityIds = [firstPlaceId, secondPlaceId, thirdPlaceId].filter(Boolean);
      for (const existing of existingEntries) {
        if (!newCommunityIds.includes(existing.communityId)) {
          await api.deleteLeaderboardEntry(existing.id);
        }
      }
    },
    onSuccess: async () => {
      // Invalidate and refetch all leaderboard queries
      await queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      await queryClient.invalidateQueries({ queryKey: ["leaderboard-sport"] });
      // Refetch the overall leaderboard immediately
      await queryClient.refetchQueries({ queryKey: ["leaderboard"] });
      toast({
        title: "Success",
        description: "Points updated successfully. Overall leaderboard has been updated.",
      });
      setSportId("");
      setFirstPlaceId("");
      setSecondPlaceId("");
      setThirdPlaceId("");
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update points",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!sportId) {
      toast({
        title: "Error",
        description: "Please select a sport",
        variant: "destructive",
      });
      return;
    }
    createOrUpdateMutation.mutate();
  };

  const handleClose = () => {
    setSportId("");
    setFirstPlaceId("");
    setSecondPlaceId("");
    setThirdPlaceId("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingSportId ? "Edit Sport Points" : "Add Sport Points"}
          </DialogTitle>
          <DialogDescription>
            Select a sport and assign 1st, 2nd, and 3rd place communities. Points will be automatically assigned (10 for 1st, 7 for 2nd, 5 for 3rd).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sport *</label>
            <SportSelect
              value={sportId}
              onValueChange={setSportId}
              placeholder="Select sport..."
              disabled={!!editingSportId}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                1st Place
              </label>
              <Popover open={firstOpen} onOpenChange={setFirstOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {firstPlaceId
                      ? communities.find((c) => c.id === firstPlaceId)?.name || "Select..."
                      : "Select..."}
                    <X className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search communities..." />
                    <CommandList>
                      <CommandEmpty>No community found.</CommandEmpty>
                      <CommandGroup>
                        {communities.map((community) => (
                          <CommandItem
                            key={community.id}
                            value={community.name}
                            onSelect={() => {
                              setFirstPlaceId(community.id);
                              setFirstOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                firstPlaceId === community.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {community.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Medal className="h-4 w-4 text-gray-400" />
                2nd Place
              </label>
              <Popover open={secondOpen} onOpenChange={setSecondOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {secondPlaceId
                      ? communities.find((c) => c.id === secondPlaceId)?.name || "Select..."
                      : "Select..."}
                    <X className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search communities..." />
                    <CommandList>
                      <CommandEmpty>No community found.</CommandEmpty>
                      <CommandGroup>
                        {communities.map((community) => (
                          <CommandItem
                            key={community.id}
                            value={community.name}
                            onSelect={() => {
                              setSecondPlaceId(community.id);
                              setSecondOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                secondPlaceId === community.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {community.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Medal className="h-4 w-4 text-orange-600" />
                3rd Place
              </label>
              <Popover open={thirdOpen} onOpenChange={setThirdOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {thirdPlaceId
                      ? communities.find((c) => c.id === thirdPlaceId)?.name || "Select..."
                      : "Select..."}
                    <X className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search communities..." />
                    <CommandList>
                      <CommandEmpty>No community found.</CommandEmpty>
                      <CommandGroup>
                        {communities.map((community) => (
                          <CommandItem
                            key={community.id}
                            value={community.name}
                            onSelect={() => {
                              setThirdPlaceId(community.id);
                              setThirdOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                thirdPlaceId === community.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {community.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createOrUpdateMutation.isPending}>
            {createOrUpdateMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
