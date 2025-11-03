import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { VolunteerEntry } from "@/api/mockDb";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function VolunteerManagement() {
  const { data: sports = [] } = useQuery({ queryKey: ["sports"], queryFn: api.listSports });
  const { data: volunteers = [] } = useQuery({ queryKey: ["volunteers"], queryFn: api.listVolunteers });

  const [selectedSportId, setSelectedSportId] = useState<string>("none");

  const filtered = useMemo(() => {
    if (!selectedSportId || selectedSportId === "none") return volunteers;
    return (volunteers as VolunteerEntry[]).filter((v) => v.sportId === selectedSportId);
  }, [volunteers, selectedSportId]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="sport">Sport</Label>
          <Select value={selectedSportId} onValueChange={setSelectedSportId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">All sports</SelectItem>
              {sports.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{`${v.firstName} ${v.middleName ? v.middleName + " " : ""}${v.lastName}`}</TableCell>
                    <TableCell className="capitalize">{v.gender}</TableCell>
                    <TableCell>{v.dob}</TableCell>
                    <TableCell>{v.email}</TableCell>
                    <TableCell>{v.phone}</TableCell>
                    <TableCell>{v.departmentId}</TableCell>
                    <TableCell>{sportName}</TableCell>
                    <TableCell>{new Date(v.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
