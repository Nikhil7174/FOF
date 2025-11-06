// Simple in-memory mock database with optional localStorage persistence

export type Role = "admin" | "community_admin" | "sports_admin" | "volunteer_admin" | "volunteer" | "user" | null;

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
      { id: "u1", username: "admin", email: "admin@fof.co.ke", password: "admin", role: "admin" },
      { id: "c1", username: "commadmin1", email: "commadmin1@fof.co.ke", password: "community", role: "community_admin", communityId: "1" },
      { id: "c2", username: "commadmin2", email: "commadmin2@fof.co.ke", password: "community", role: "community_admin", communityId: "2" },
      { id: "s1", username: "footballadmin", email: "football@fof.co.ke", password: "football", role: "sports_admin", sportId: "1" },
      { id: "s2", username: "basketballadmin", email: "basketball@fof.co.ke", password: "basketball", role: "sports_admin", sportId: "2" },
      { id: "s3", username: "athleticsadmin", email: "athletics@fof.co.ke", password: "athletics", role: "sports_admin", sportId: "4" },
      { id: "vadmin", username: "voladmin", email: "voladmin@fof.co.ke", password: "voladmin", role: "volunteer_admin" },
      { id: "v1", username: "volunteer", email: "volunteer@fof.co.ke", password: "volunteer", role: "volunteer" },
    ],
    participants: [
      {
        id: "p1",
        firstName: "Asha",
        middleName: "",
        lastName: "Mwangi",
        gender: "female",
        dob: "2004-05-12",
        email: "asha.mwangi@example.com",
        phone: "+254711000001",
        communityId: "1",
        nextOfKin: { firstName: "Mary", lastName: "Mwangi", phone: "+254711222333" },
        sports: ["1"],
        status: "pending",
        teamName: "Nairobi Queens",
        createdAt: new Date().toISOString(),
      },
      {
        id: "p2",
        firstName: "Brian",
        middleName: "",
        lastName: "Otieno",
        gender: "male",
        dob: "2003-09-22",
        email: "brian.otieno@example.com",
        phone: "+254711000002",
        communityId: "2",
        nextOfKin: { firstName: "Peter", lastName: "Otieno", phone: "+254722111444" },
        sports: ["2","4"],
        status: "accepted",
        createdAt: new Date().toISOString(),
      },
    ],
    volunteers: [
      {
        id: "vol1",
        firstName: "Grace",
        lastName: "Kariuki",
        gender: "female",
        dob: "1999-01-10",
        email: "grace.kariuki@example.com",
        phone: "+254733100200",
        departmentId: "d1",
        sportId: "1",
        createdAt: new Date().toISOString(),
      },
      {
        id: "vol2",
        firstName: "Hassan",
        lastName: "Ali",
        gender: "male",
        dob: "1997-07-18",
        email: "hassan.ali@example.com",
        phone: "+254733100201",
        departmentId: "d2",
        sportId: "2",
        createdAt: new Date().toISOString(),
      },
      {
        id: "vol3",
        firstName: "Linet",
        lastName: "Chebet",
        gender: "female",
        dob: "2000-03-03",
        email: "linet.chebet@example.com",
        phone: "+254733100202",
        departmentId: "d1",
        sportId: "4",
        createdAt: new Date().toISOString(),
      },
      {
        id: "vol4",
        firstName: "Peter",
        lastName: "Mwangi",
        gender: "male",
        dob: "1995-05-15",
        email: "peter.mwangi@example.com",
        phone: "+254733100203",
        departmentId: "d1",
        createdAt: new Date().toISOString(),
      },
      {
        id: "vol5",
        firstName: "Sarah",
        lastName: "Wanjiku",
        gender: "female",
        dob: "1998-08-22",
        email: "sarah.wanjiku@example.com",
        phone: "+254733100204",
        departmentId: "d2",
        createdAt: new Date().toISOString(),
      },
      {
        id: "vol6",
        firstName: "David",
        lastName: "Ochieng",
        gender: "male",
        dob: "1996-11-30",
        email: "david.ochieng@example.com",
        phone: "+254733100205",
        departmentId: "d1",
        createdAt: new Date().toISOString(),
      },
      {
        id: "vol7",
        firstName: "Mary",
        lastName: "Njeri",
        gender: "female",
        dob: "1999-02-14",
        email: "mary.njeri@example.com",
        phone: "+254733100206",
        departmentId: "d2",
        createdAt: new Date().toISOString(),
      },
      {
        id: "vol8",
        firstName: "James",
        lastName: "Kipchoge",
        gender: "male",
        dob: "1994-09-10",
        email: "james.kipchoge@example.com",
        phone: "+254733100207",
        departmentId: "d1",
        createdAt: new Date().toISOString(),
      },
      {
        id: "vol9",
        firstName: "Ruth",
        lastName: "Kamau",
        gender: "female",
        dob: "2001-06-25",
        email: "ruth.kamau@example.com",
        phone: "+254733100208",
        departmentId: "d2",
        createdAt: new Date().toISOString(),
      },
      {
        id: "vol10",
        firstName: "Michael",
        lastName: "Mutua",
        gender: "male",
        dob: "1997-12-05",
        email: "michael.mutua@example.com",
        phone: "+254733100209",
        departmentId: "d1",
        createdAt: new Date().toISOString(),
      },
    ],
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
    if (raw) {
      const parsed = JSON.parse(raw) as MockDbShape;
      // If volunteers array is missing or empty, reset to seed data
      if (!parsed.volunteers || parsed.volunteers.length === 0) {
        return seed();
      }
      return parsed;
    }
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


