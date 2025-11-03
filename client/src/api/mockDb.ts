// Simple in-memory mock database with optional localStorage persistence

export type Role = "admin" | "community" | "volunteer" | null;

export interface User {
  id: string;
  username: string;
  email?: string;
  password: string;
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
  sports: string[]; // sport ids
  status: "pending" | "accepted" | "rejected";
  teamName?: string;
  createdAt: string;
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

export interface CommunityRecord {
  id: string;
  name: string;
  active: boolean;
  contactPerson: string;
  phone: string;
  email: string;
  password?: string; // Optional password for community access
}

export interface SportRecord {
  id: string;
  name: string;
  active: boolean;
  type: "individual" | "team";
  requiresTeamName: boolean;
  venue?: string;
  timings?: string;
  date?: string; // ISO date string
  gender?: "male" | "female" | "mixed" | null;
  ageLimit?: {
    min?: number;
    max?: number;
  };
}

export interface CalendarItem {
  id: string;
  sportId: string;
  date: string;
  time: string;
  venue: string;
  type: string;
}

export interface DepartmentRecord { id: string; name: string }

export interface SettingsRecord {
  ageCalculatorDate: string;
}

interface MockDbShape {
  users: User[];
  participants: Participant[];
  volunteers: VolunteerEntry[];
  communities: CommunityRecord[];
  sports: SportRecord[];
  departments: DepartmentRecord[];
  calendar: CalendarItem[];
  settings: SettingsRecord;
  outboxEmails: { id: string; to: string; from: string; subject: string; body: string; createdAt: string }[];
}

const STORAGE_KEY = "fof-mock-db";

function seed(): MockDbShape {
  return {
    users: [
      { id: "u1", username: "admin", password: "admin", role: "admin" },
      { id: "c1", username: "nairobi", password: "community", role: "community", communityId: "1" },
      { id: "v1", username: "volunteer", password: "volunteer", role: "volunteer" },
    ],
    participants: [],
    volunteers: [],
    communities: [
      { id: "1", name: "Nairobi Central", active: true, contactPerson: "Ahmed Hassan", phone: "+254 712 111 111", email: "nairobi.central@fof.co.ke" },
      { id: "2", name: "Westlands", active: true, contactPerson: "Jennifer Muthoni", phone: "+254 723 222 222", email: "westlands@fof.co.ke" },
    ],
    sports: [
      { id: "1", name: "Football", active: true, type: "team", requiresTeamName: true },
      { id: "2", name: "Basketball", active: true, type: "team", requiresTeamName: true },
      { id: "4", name: "Athletics", active: true, type: "individual", requiresTeamName: false },
    ],
    departments: [
      { id: "d1", name: "Event Coordination" },
      { id: "d2", name: "Medical Support" },
    ],
    calendar: [
      { id: "e1", sportId: "1", date: "2026-11-15", time: "09:00", venue: "Main Stadium", type: "Qualifier" },
      { id: "e2", sportId: "2", date: "2026-11-15", time: "11:00", venue: "Sports Complex A", type: "Group" },
    ],
    settings: { ageCalculatorDate: "2026-11-01" },
    outboxEmails: [],
  };
}

function load(): MockDbShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockDbShape;
  } catch {}
  return seed();
}

function save(db: MockDbShape) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {}
}

export const mockDb = {
  state: load(),
  save() {
    save(this.state);
  },
  reset() {
    this.state = seed();
    this.save();
  },
};

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}


