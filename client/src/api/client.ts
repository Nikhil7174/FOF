// API client for backend server

// Import types from shared types file
import type { Role, User, Participant, VolunteerEntry, SportRecord, CommunityRecord, DepartmentRecord, CalendarItem, SettingsRecord, CommunityContact, Convenor, TournamentFormat, LeaderboardEntry, LeaderboardRanking, SportLeaderboardEntry } from "@/types";

// const API_BASE_URL = import.meta.env.VITE_API_URL || "https://fof-klcd.onrender.com/api";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface CreateParticipantInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: "male" | "female";
  dob: string;
  email: string;
  username: string;
  phone: string;
  password: string;
  communityId: string;
  nextOfKin: {
    firstName: string;
    middleName?: string;
    lastName: string;
    phone: string;
  };
  sports: string[];
  teamName?: string;
}

export interface CreateVolunteerInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: "male" | "female";
  dob: string;
  email: string;
  username: string;
  phone: string;
  password: string;
  sportId?: string;
}

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
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[API] ${options.method || "GET"} ${url}`, options.body ? JSON.parse(options.body as string) : "");

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`[API] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      console.error(`[API] Error response:`, error);
      const errorMessage = error.error || error.message || `HTTP ${response.status}`;
      const errorObj = new Error(errorMessage);
      // Preserve original error details for better error handling
      (errorObj as any).details = error.details;
      (errorObj as any).originalError = error;
      throw errorObj;
    }

    const data = await response.json();
    console.log(`[API] Success:`, data);
    return data;
  } catch (error: any) {
    console.error(`[API] Request failed:`, error);
    throw error;
  }
}

// Re-export types for convenience
export type { Role, User, Participant, VolunteerEntry, SportRecord, CommunityRecord, DepartmentRecord, CalendarItem, SettingsRecord, CommunityContact, Convenor, TournamentFormat, LeaderboardEntry, LeaderboardRanking, SportLeaderboardEntry };

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

  async checkUsernameAvailability(username: string): Promise<boolean> {
    const response = await request<{ available: boolean }>(
      `/auth/username-availability?username=${encodeURIComponent(username)}`
    );
    return response.available;
  },

  // Participants
  async listParticipants(): Promise<Participant[]> {
    return request<Participant[]>("/participants");
  },

  async createParticipant(input: CreateParticipantInput): Promise<Participant> {
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

  async getMyVolunteer(): Promise<VolunteerEntry | null> {
    try {
      return await request<VolunteerEntry>("/volunteers/me");
    } catch {
      return null;
    }
  },
  async updateMyVolunteerProfile(data: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<VolunteerEntry> {
    return request<VolunteerEntry>("/volunteers/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  async updateMyVolunteerSport(sportId: string | null): Promise<VolunteerEntry> {
    return request<VolunteerEntry>("/volunteers/me/sport", {
      method: "PATCH",
      body: JSON.stringify({ sportId }),
    });
  },

  async updateParticipantProfile(data: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    phone?: string;
    nextOfKin?: {
      firstName: string;
      middleName?: string;
      lastName: string;
      phone: string;
    };
    teamName?: string;
  }): Promise<Participant> {
    return request<Participant>("/participants/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async updateParticipantSports(sportIds: string[]): Promise<Participant> {
    return request<Participant>("/participants/me/sports", {
      method: "PATCH",
      body: JSON.stringify({ sportIds }),
    });
  },

  // Volunteers
  async createVolunteer(
    input: CreateVolunteerInput
  ): Promise<VolunteerEntry> {
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
  async updateSettings(data: { ageCalculatorDate?: string | Date; profileFreezeDate?: string | Date | null }): Promise<SettingsRecord> {
    return request<SettingsRecord>("/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Email
  async sendEmail(to: string, subject: string, body: string, from = "registration@fof.co.ke"): Promise<boolean> {
    await request("/email/send", {
      method: "POST",
      body: JSON.stringify({ to, subject, body, from }),
    });
    return true;
  },

  async sendRegistrationConfirmation(to: string): Promise<boolean> {
    await request("/email/registration-confirmation", {
      method: "POST",
      body: JSON.stringify({ to }),
    });
    return true;
  },

  async sendContactMessage(name: string, email: string, message: string): Promise<boolean> {
    await request("/email/contact", {
      method: "POST",
      body: JSON.stringify({ name, email, message }),
    });
    return true;
  },

  async listOutbox(): Promise<Array<{ id: string; to: string; from: string; subject: string; body: string; createdAt: string }>> {
    return request<Array<{ id: string; to: string; from: string; subject: string; body: string; createdAt: string }>>("/email/outbox");
  },

  // Community Contacts
  async listCommunityContacts(communityId: string): Promise<CommunityContact[]> {
    return request<CommunityContact[]>(`/community-contacts/community/${communityId}`);
  },

  async createCommunityContact(communityId: string, input: Omit<CommunityContact, "id" | "communityId" | "createdAt" | "updatedAt">): Promise<CommunityContact> {
    return request<CommunityContact>(`/community-contacts/community/${communityId}`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateCommunityContact(id: string, input: Partial<Omit<CommunityContact, "id" | "communityId" | "createdAt" | "updatedAt">>): Promise<CommunityContact> {
    return request<CommunityContact>(`/community-contacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteCommunityContact(id: string): Promise<boolean> {
    await request(`/community-contacts/${id}`, { method: "DELETE" });
    return true;
  },

  // Calendar
  async getCalendarItem(id: string): Promise<CalendarItem> {
    return request<CalendarItem>(`/calendar/${id}`);
  },

  async createCalendarItem(input: Omit<CalendarItem, "id">): Promise<CalendarItem> {
    return request<CalendarItem>("/calendar", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateCalendarItem(id: string, input: Partial<Omit<CalendarItem, "id">>): Promise<CalendarItem> {
    return request<CalendarItem>(`/calendar/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteCalendarItem(id: string): Promise<boolean> {
    await request(`/calendar/${id}`, { method: "DELETE" });
    return true;
  },

  // Convenors
  async listConvenors(): Promise<Convenor[]> {
    return request<Convenor[]>("/convenors");
  },

  async getConvenor(id: string): Promise<Convenor> {
    return request<Convenor>(`/convenors/${id}`);
  },

  async getConvenorBySport(sportId: string): Promise<Convenor | null> {
    try {
      return await request<Convenor>(`/convenors/sport/${sportId}`);
    } catch {
      return null;
    }
  },

  async createConvenor(input: Omit<Convenor, "id" | "createdAt" | "updatedAt">): Promise<Convenor> {
    return request<Convenor>("/convenors", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateConvenor(id: string, input: Partial<Omit<Convenor, "id" | "createdAt" | "updatedAt">>): Promise<Convenor> {
    return request<Convenor>(`/convenors/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteConvenor(id: string): Promise<boolean> {
    await request(`/convenors/${id}`, { method: "DELETE" });
    return true;
  },

  // Tournament Formats
  async listTournamentFormats(): Promise<TournamentFormat[]> {
    return request<TournamentFormat[]>("/tournament-formats");
  },

  async getTournamentFormat(id: string): Promise<TournamentFormat> {
    return request<TournamentFormat>(`/tournament-formats/${id}`);
  },

  async getTournamentFormatByCategory(category: string): Promise<TournamentFormat | null> {
    try {
      return await request<TournamentFormat>(`/tournament-formats/category/${category}`);
    } catch {
      return null;
    }
  },

  async createTournamentFormat(input: Omit<TournamentFormat, "id" | "createdAt" | "updatedAt">): Promise<TournamentFormat> {
    return request<TournamentFormat>("/tournament-formats", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateTournamentFormat(id: string, input: Partial<Omit<TournamentFormat, "id" | "createdAt" | "updatedAt">>): Promise<TournamentFormat> {
    return request<TournamentFormat>(`/tournament-formats/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteTournamentFormat(id: string): Promise<boolean> {
    await request(`/tournament-formats/${id}`, { method: "DELETE" });
    return true;
  },

  // Leaderboard
  async getLeaderboard(): Promise<LeaderboardRanking[]> {
    return request<LeaderboardRanking[]>("/leaderboard");
  },

  async getLeaderboardBySport(sportId: string): Promise<SportLeaderboardEntry[]> {
    return request<SportLeaderboardEntry[]>(`/leaderboard/sport/${sportId}`);
  },

  async getLeaderboardByCommunity(communityId: string): Promise<LeaderboardEntry[]> {
    return request<LeaderboardEntry[]>(`/leaderboard/community/${communityId}`);
  },

  async listLeaderboardEntries(): Promise<LeaderboardEntry[]> {
    return request<LeaderboardEntry[]>("/leaderboard/entries");
  },

  async createLeaderboardEntry(input: {
    communityId: string;
    sportId: string;
    score: number;
    position?: number | null;
    medalType?: "gold" | "silver" | "bronze" | "none";
    notes?: string | null;
  }): Promise<LeaderboardEntry> {
    return request<LeaderboardEntry>("/leaderboard", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateLeaderboardEntry(
    id: string,
    input: Partial<{
      communityId: string;
      sportId: string;
      score: number;
      position: number | null;
      medalType: "gold" | "silver" | "bronze" | "none";
      notes: string | null;
    }>
  ): Promise<LeaderboardEntry> {
    return request<LeaderboardEntry>(`/leaderboard/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteLeaderboardEntry(id: string): Promise<boolean> {
    await request(`/leaderboard/${id}`, { method: "DELETE" });
    return true;
  },

  // Export functions
  async exportUsers(format: "csv" | "excel"): Promise<void> {
    const token = getToken();
    const url = `${API_BASE_URL}/users/export/${format}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Export failed");
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `users.${format === "csv" ? "csv" : "xlsx"}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  },

  async exportParticipants(format: "csv" | "excel"): Promise<void> {
    const token = getToken();
    const url = `${API_BASE_URL}/participants/export/${format}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Export failed");
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    const contentDisposition = response.headers.get("content-disposition");
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1]?.replace(/"/g, "") || `participants.${format === "csv" ? "csv" : "xlsx"}`
      : `participants.${format === "csv" ? "csv" : "xlsx"}`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  },

  async exportVolunteers(format: "csv" | "excel"): Promise<void> {
    const token = getToken();
    const url = `${API_BASE_URL}/volunteers/export/${format}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Export failed");
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `volunteers.${format === "csv" ? "csv" : "xlsx"}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  },

  async exportSports(format: "csv" | "excel"): Promise<void> {
    const token = getToken();
    const url = `${API_BASE_URL}/sports/export/${format}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Export failed");
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `sports.${format === "csv" ? "csv" : "xlsx"}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  },

  async exportCommunities(format: "csv" | "excel"): Promise<void> {
    const token = getToken();
    const url = `${API_BASE_URL}/communities/export/${format}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Export failed");
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `communities.${format === "csv" ? "csv" : "xlsx"}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  },
};

