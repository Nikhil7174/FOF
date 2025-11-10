// Shared types for the application

export type Role = "admin" | "community_admin" | "sports_admin" | "volunteer_admin" | "volunteer" | "user" | null;

export interface User {
  id: string;
  username: string;
  email?: string;
  password?: string; // Only for internal use, should not be exposed
  role: Exclude<Role, null>;
  communityId?: string;
  sportId?: string;
}

export interface Participant {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: "male" | "female";
  dob: string; // ISO date
  email: string;
  phone: string;
  communityId: string;
  nextOfKin: {
    firstName: string;
    middleName?: string;
    lastName: string;
    phone: string;
  };
  sports: string[] | Array<{ sport: { id: string; name: string } }>; // Can be array of IDs or array of sport objects
  status: "pending" | "accepted" | "rejected";
  teamName?: string;
  createdAt: string;
  // Helper to get sport IDs array
  getSportIds?: () => string[];
}

export interface VolunteerEntry {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: "male" | "female";
  dob: string;
  email: string;
  phone: string;
  departmentId: string;
  sportId?: string;
  createdAt: string;
}

export interface SportRecord {
  id: string;
  name: string;
  active: boolean;
  type: "individual" | "team";
  requiresTeamName: boolean;
  parentId?: string;
  venue?: string;
  timings?: string;
  date?: string; // ISO date string
  gender?: "male" | "female" | "mixed" | null;
  ageLimit?: {
    min?: number;
    max?: number;
  };
  ageLimitMin?: number; // Alternative format
  ageLimitMax?: number; // Alternative format
  rules?: string;
  adminEmail?: string | null;
  adminPassword?: string | null;
}

export interface CommunityRecord {
  id: string;
  name: string;
  active: boolean;
  contactPerson: string;
  phone: string;
  email: string;
  password?: string; // Optional password for community access
  adminEmail?: string | null;
  adminPassword?: string | null;
}

export interface DepartmentRecord {
  id: string;
  name: string;
}

export interface CalendarItem {
  id: string;
  sportId: string;
  date: string;
  time: string;
  venue: string;
  type: string;
}

export interface SettingsRecord {
  ageCalculatorDate: string;
}

export interface CommunityContact {
  id: string;
  communityId: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Convenor {
  id: string;
  name: string;
  phone: string;
  email: string;
  sportId?: string;
  sport?: SportRecord;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentFormat {
  id: string;
  category: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  id: string;
  communityId: string;
  sportId: string;
  score: number;
  position?: number | null;
  medalType: "gold" | "silver" | "bronze" | "none";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  community?: {
    id: string;
    name: string;
    active?: boolean;
  };
  sport?: {
    id: string;
    name: string;
  };
}

export interface LeaderboardRanking {
  communityId: string;
  communityName: string;
  totalScore: number;
  entryCount: number;
  rank: number;
}

export interface SportLeaderboardEntry {
  id: string;
  communityId: string;
  communityName: string;
  sportId: string;
  sportName: string;
  score: number;
  position?: number | null;
  medalType: "gold" | "silver" | "bronze" | "none";
  notes?: string | null;
  rank: number;
}

