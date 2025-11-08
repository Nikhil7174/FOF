// API client for backend server

// Import types from shared types file
import type { Role, User, Participant, VolunteerEntry, SportRecord, CommunityRecord, DepartmentRecord, CalendarItem, SettingsRecord } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Get auth token from localStorage
function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

// Set auth token in localStorage
function setToken(token: string): void {
  localStorage.setItem("auth_token", token);
}

// Remove auth token from localStorage
function removeToken(): void {
  localStorage.removeItem("auth_token");
}

// API request helper
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Re-export types for convenience
export type { Role, User, Participant, VolunteerEntry, SportRecord, CommunityRecord, DepartmentRecord, CalendarItem, SettingsRecord };

// API methods
export const api = {
  // Auth
  async login(username: string, password: string): Promise<User> {
    const response = await request<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setToken(response.token);
    return response.user;
  },

  async me(): Promise<User | null> {
    // Check if token exists before making request
    const token = getToken();
    if (!token) {
      return null;
    }
    try {
      return await request<User>("/auth/me");
    } catch {
      return null;
    }
  },

  async logout(): Promise<boolean> {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      // Ignore errors on logout
    }
    removeToken();
    return true;
  },

  async signup(
    role: "community" | "volunteer",
    username: string,
    password: string,
    extra?: { communityId?: string; volunteerId?: string }
  ): Promise<User> {
    const response = await request<{ user: User; token: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ role, username, password, ...extra }),
    });
    setToken(response.token);
    return response.user;
  },

  // Participants
  async listParticipants(): Promise<Participant[]> {
    return request<Participant[]>("/participants");
  },

  async createParticipant(
    input: Omit<Participant, "id" | "status" | "createdAt" | "sports" | "getSportIds"> & { sports: string[] }
  ): Promise<Participant> {
    return request<Participant>("/participants", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async setParticipantStatus(id: string, status: Participant["status"]): Promise<Participant> {
    return request<Participant>(`/participants/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async deleteParticipant(id: string): Promise<boolean> {
    await request(`/participants/${id}`, { method: "DELETE" });
    return true;
  },

  async getMyParticipant(): Promise<Participant | null> {
    try {
      return await request<Participant>("/participants/me");
    } catch {
      return null;
    }
  },

  async updateParticipantSports(sportIds: string[]): Promise<Participant> {
    return request<Participant>("/participants/me/sports", {
      method: "PATCH",
      body: JSON.stringify({ sportIds }),
    });
  },

  // Volunteers
  async createVolunteer(input: Omit<VolunteerEntry, "id" | "createdAt">): Promise<VolunteerEntry> {
    return request<VolunteerEntry>("/volunteers", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async listVolunteers(sportId?: string): Promise<VolunteerEntry[]> {
    const query = sportId ? `?sportId=${sportId}` : "";
    return request<VolunteerEntry[]>(`/volunteers${query}`);
  },

  async updateVolunteer(id: string, data: Partial<VolunteerEntry>): Promise<VolunteerEntry> {
    return request<VolunteerEntry>(`/volunteers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Sports
  async listSports(): Promise<SportRecord[]> {
    return request<SportRecord[]>("/sports");
  },

  async listSportsTree(): Promise<Array<{ parent: SportRecord; children: SportRecord[] }>> {
    return request<Array<{ parent: SportRecord; children: SportRecord[] }>>("/sports/tree");
  },

  async getSubsports(parentId: string): Promise<SportRecord[]> {
    return request<SportRecord[]>(`/sports/subsports/${parentId}`);
  },

  async getSport(id: string): Promise<SportRecord> {
    return request<SportRecord>(`/sports/${id}`);
  },

  async createSport(input: Omit<SportRecord, "id">): Promise<SportRecord> {
    return request<SportRecord>("/sports", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateSport(id: string, input: Partial<Omit<SportRecord, "id">>): Promise<SportRecord> {
    return request<SportRecord>(`/sports/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteSport(id: string): Promise<boolean> {
    await request(`/sports/${id}`, { method: "DELETE" });
    return true;
  },

  // Communities
  async listCommunities(): Promise<CommunityRecord[]> {
    return request<CommunityRecord[]>("/communities");
  },

  async getCommunity(id: string): Promise<CommunityRecord> {
    return request<CommunityRecord>(`/communities/${id}`);
  },

  async createCommunity(input: Omit<CommunityRecord, "id"> & { password?: string }): Promise<CommunityRecord> {
    return request<CommunityRecord>("/communities", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateCommunity(
    id: string,
    input: Partial<Omit<CommunityRecord, "id">> & { password?: string }
  ): Promise<CommunityRecord> {
    return request<CommunityRecord>(`/communities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteCommunity(id: string): Promise<boolean> {
    await request(`/communities/${id}`, { method: "DELETE" });
    return true;
  },

  // Users
  async listUsers(): Promise<User[]> {
    return request<User[]>("/users");
  },

  async getUser(id: string): Promise<User> {
    return request<User>(`/users/${id}`);
  },

  async createUser(input: Omit<User, "id"> & { password: string }): Promise<User> {
    return request<User>("/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateUser(id: string, input: Partial<Omit<User, "id">> & { password?: string }): Promise<User> {
    return request<User>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteUser(id: string): Promise<boolean> {
    await request(`/users/${id}`, { method: "DELETE" });
    return true;
  },

  // Departments
  async listDepartments(): Promise<DepartmentRecord[]> {
    return request<DepartmentRecord[]>("/departments");
  },

  // Calendar
  async listCalendar(): Promise<CalendarItem[]> {
    return request<CalendarItem[]>("/calendar");
  },

  async listTiming(): Promise<Array<{ sportId: string; time: string; date: string; venue: string }>> {
    return request<Array<{ sportId: string; time: string; date: string; venue: string }>>("/calendar/timing");
  },

  async listDraws(): Promise<Array<{ sportId: string; url: string }>> {
    return request<Array<{ sportId: string; url: string }>>("/calendar/draws");
  },

  // Settings
  async getSettings(): Promise<SettingsRecord> {
    return request<SettingsRecord>("/settings");
  },

  // Email
  async sendEmail(to: string, subject: string, body: string, from = "registration@fof.co.ke"): Promise<boolean> {
    await request("/email/send", {
      method: "POST",
      body: JSON.stringify({ to, subject, body, from }),
    });
    return true;
  },

  async listOutbox(): Promise<Array<{ id: string; to: string; from: string; subject: string; body: string; createdAt: string }>> {
    return request<Array<{ id: string; to: string; from: string; subject: string; body: string; createdAt: string }>>("/email/outbox");
  },
};

