// Export types from shared types file
export type {
  Role,
  User,
  Participant,
  VolunteerEntry,
  SportRecord,
  CommunityRecord,
  DepartmentRecord,
  CalendarItem,
  SettingsRecord,
  CommunityContact,
  Convenor,
  TournamentFormat,
} from "@/types";

export type { CreateParticipantInput } from "./client";

// Use real API client
export { api } from "./client";


