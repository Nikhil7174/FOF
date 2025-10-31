import { mockDb, uid, Participant, VolunteerEntry } from "./mockDb";

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const api = {
  async login(username: string, password: string) {
    await delay();
    const user = mockDb.state.users.find((u) => u.username === username && u.password === password);
    if (!user) throw new Error("Invalid credentials");
    const session = { userId: user.id };
    localStorage.setItem("fof-session", JSON.stringify(session));
    return user;
  },
  async me() {
    await delay(100);
    const raw = localStorage.getItem("fof-session");
    if (!raw) return null;
    const { userId } = JSON.parse(raw);
    return mockDb.state.users.find((u) => u.id === userId) ?? null;
  },
  async logout() {
    await delay(100);
    localStorage.removeItem("fof-session");
    return true;
  },
  async signup(role: "community" | "volunteer", username: string, password: string, extra?: { communityId?: string; volunteerId?: string }) {
    await delay();
    if (mockDb.state.users.some((u) => u.username === username)) throw new Error("Username already exists");
    const user = { id: uid("u"), username, password, role, ...extra } as any;
    mockDb.state.users.push(user);
    mockDb.save();
    return user;
  },

  // Participants
  async listParticipants() {
    await delay();
    return mockDb.state.participants;
  },
  async createParticipant(input: Omit<Participant, "id" | "status" | "createdAt">) {
    await delay();
    const record: Participant = { ...input, id: uid("p"), status: "pending", createdAt: new Date().toISOString() };
    mockDb.state.participants.push(record);
    mockDb.save();
    return record;
  },
  async setParticipantStatus(id: string, status: Participant["status"]) {
    await delay(150);
    const p = mockDb.state.participants.find((x) => x.id === id);
    if (!p) throw new Error("Not found");
    p.status = status;
    mockDb.save();
    return p;
  },

  // Volunteers
  async createVolunteer(input: Omit<VolunteerEntry, "id" | "createdAt">) {
    await delay();
    const record: VolunteerEntry = { ...input, id: uid("v"), createdAt: new Date().toISOString() };
    mockDb.state.volunteers.push(record);
    mockDb.save();
    return record;
  },

  // Lookups
  async listCommunities() {
    await delay(100);
    return mockDb.state.communities;
  },
  async listSports() {
    await delay(100);
    return mockDb.state.sports;
  },
  async listDepartments() {
    await delay(100);
    return mockDb.state.departments;
  },
  async listCalendar() {
    await delay(120);
    return mockDb.state.calendar;
  },
  async listTiming() {
    await delay(120);
    // timing: reuse calendar structure for now
    return mockDb.state.calendar.map((e) => ({ sportId: e.sportId, time: e.time, date: e.date, venue: e.venue }));
  },
  async listDraws() {
    await delay(120);
    // placeholder draws
    return [
      { sportId: "1", url: "https://example.com/draws/football.pdf" },
      { sportId: "2", url: "https://example.com/draws/basketball.pdf" },
    ];
  },

  // Settings
  async getSettings() {
    await delay(80);
    return mockDb.state.settings;
  },

  // Emails (mock outbox)
  async sendEmail(to: string, subject: string, body: string, from = "registration@fof.co.ke") {
    await delay(50);
    mockDb.state.outboxEmails.push({ id: uid("m"), to, from, subject, body, createdAt: new Date().toISOString() });
    mockDb.save();
    return true;
  },
  async listOutbox() {
    await delay(50);
    return mockDb.state.outboxEmails.slice().reverse();
  },
};


