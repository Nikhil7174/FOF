import { mockDb, uid, Participant, VolunteerEntry, SportRecord, CommunityRecord, User } from "./mockDb";

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

  // Sports CRUD
  async listSports() {
    await delay(100);
    return mockDb.state.sports;
  },
  async getSport(id: string) {
    await delay(100);
    const sport = mockDb.state.sports.find((s) => s.id === id);
    if (!sport) throw new Error("Sport not found");
    return sport;
  },
  async createSport(input: Omit<SportRecord, "id">) {
    await delay();
    const sport: SportRecord = { ...input, id: uid("sport") };
    mockDb.state.sports.push(sport);
    mockDb.save();
    return sport;
  },
  async updateSport(id: string, input: Partial<Omit<SportRecord, "id">>) {
    await delay(150);
    const sport = mockDb.state.sports.find((s) => s.id === id);
    if (!sport) throw new Error("Sport not found");
    Object.assign(sport, input);
    mockDb.save();
    return sport;
  },
  async deleteSport(id: string) {
    await delay(150);
    const index = mockDb.state.sports.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Sport not found");
    mockDb.state.sports.splice(index, 1);
    mockDb.save();
    return true;
  },

  // Communities CRUD
  async listCommunities() {
    await delay(100);
    // Mask passwords for security
    return mockDb.state.communities.map(({ password, ...community }) => ({
      ...community,
      password: password ? "***" : undefined,
    }));
  },
  async getCommunity(id: string) {
    await delay(100);
    const community = mockDb.state.communities.find((c) => c.id === id);
    if (!community) throw new Error("Community not found");
    // Mask password for security
    const { password, ...safeCommunity } = community;
    return { ...safeCommunity, password: password ? "***" : undefined };
  },
  async createCommunity(input: Omit<CommunityRecord, "id">) {
    await delay();
    const community: CommunityRecord = { ...input, id: uid("comm") };
    mockDb.state.communities.push(community);
    mockDb.save();
    // Mask password for security
    const { password, ...safeCommunity } = community;
    return { ...safeCommunity, password: password ? "***" : undefined };
  },
  async updateCommunity(id: string, input: Partial<Omit<CommunityRecord, "id">>) {
    await delay(150);
    const community = mockDb.state.communities.find((c) => c.id === id);
    if (!community) throw new Error("Community not found");
    Object.assign(community, input);
    mockDb.save();
    // Mask password for security
    const { password, ...safeCommunity } = community;
    return { ...safeCommunity, password: password ? "***" : undefined };
  },
  async deleteCommunity(id: string) {
    await delay(150);
    const index = mockDb.state.communities.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Community not found");
    mockDb.state.communities.splice(index, 1);
    mockDb.save();
    return true;
  },

  // Users CRUD
  async listUsers() {
    await delay(100);
    return mockDb.state.users.map(({ password, ...user }) => ({ ...user, password: "***" })); // Don't expose passwords
  },
  async getUser(id: string) {
    await delay(100);
    const user = mockDb.state.users.find((u) => u.id === id);
    if (!user) throw new Error("User not found");
    const { password, ...safeUser } = user;
    return { ...safeUser, password: "***" };
  },
  async createUser(input: Omit<User, "id">) {
    await delay();
    if (mockDb.state.users.some((u) => u.username === input.username)) {
      throw new Error("Username already exists");
    }
    const user: User = { ...input, id: uid("u") };
    mockDb.state.users.push(user);
    mockDb.save();
    const { password, ...safeUser } = user;
    return { ...safeUser, password: "***" };
  },
  async updateUser(id: string, input: Partial<Omit<User, "id">>) {
    await delay(150);
    const user = mockDb.state.users.find((u) => u.id === id);
    if (!user) throw new Error("User not found");
    if (input.username && input.username !== user.username) {
      if (mockDb.state.users.some((u) => u.username === input.username)) {
        throw new Error("Username already exists");
      }
    }
    Object.assign(user, input);
    mockDb.save();
    const { password, ...safeUser } = user;
    return { ...safeUser, password: "***" };
  },
  async deleteUser(id: string) {
    await delay(150);
    const index = mockDb.state.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("User not found");
    mockDb.state.users.splice(index, 1);
    mockDb.save();
    return true;
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


