export interface Community {
  id: string;
  name: string;
  color: string;
}

export interface Sport {
  id: string;
  name: string;
  category: string;
  participants: number;
  maxParticipants: number;
}

export interface CalendarEvent {
  id: string;
  sport: string;
  date: string;
  time: string;
  venue: string;
  type: string;
}

export interface SportsConvenor {
  id: string;
  name: string;
  sport: string;
  phone: string;
  email: string;
}

export interface CommunityContact {
  id: string;
  community: string;
  contactPerson: string;
  phone: string;
  email: string;
}

export const communities: Community[] = [
  { id: "1", name: "Nairobi Central", color: "#FF6B35" },
  { id: "2", name: "Westlands", color: "#17B8BE" },
  { id: "3", name: "Karen", color: "#FFC43D" },
  { id: "4", name: "Eastleigh", color: "#06FFA5" },
  { id: "5", name: "South B", color: "#EE4266" },
  { id: "6", name: "Lavington", color: "#8338EC" },
];

export const sports: Sport[] = [
  { id: "1", name: "Football", category: "Team Sport", participants: 156, maxParticipants: 200 },
  { id: "2", name: "Basketball", category: "Team Sport", participants: 89, maxParticipants: 120 },
  { id: "3", name: "Volleyball", category: "Team Sport", participants: 112, maxParticipants: 150 },
  { id: "4", name: "Athletics", category: "Individual", participants: 203, maxParticipants: 250 },
  { id: "5", name: "Swimming", category: "Individual", participants: 67, maxParticipants: 100 },
  { id: "6", name: "Table Tennis", category: "Individual", participants: 54, maxParticipants: 80 },
  { id: "7", name: "Badminton", category: "Individual", participants: 78, maxParticipants: 100 },
  { id: "8", name: "Cricket", category: "Team Sport", participants: 95, maxParticipants: 150 },
];

export const calendarEvents: CalendarEvent[] = [
  { id: "1", sport: "Football", date: "2024-11-15", time: "09:00 AM", venue: "Main Stadium", type: "Qualifier" },
  { id: "2", sport: "Basketball", date: "2024-11-15", time: "11:00 AM", venue: "Sports Complex A", type: "Group Stage" },
  { id: "3", sport: "Volleyball", date: "2024-11-15", time: "02:00 PM", venue: "Sports Complex B", type: "Group Stage" },
  { id: "4", sport: "Athletics", date: "2024-11-16", time: "08:00 AM", venue: "Main Stadium", type: "Heats" },
  { id: "5", sport: "Swimming", date: "2024-11-16", time: "10:00 AM", venue: "Aquatic Center", type: "Heats" },
  { id: "6", sport: "Table Tennis", date: "2024-11-16", time: "01:00 PM", venue: "Indoor Arena", type: "Preliminary" },
  { id: "7", sport: "Badminton", date: "2024-11-17", time: "09:00 AM", venue: "Indoor Arena", type: "Quarter Finals" },
  { id: "8", sport: "Cricket", date: "2024-11-17", time: "11:00 AM", venue: "Cricket Grounds", type: "Semi Finals" },
  { id: "9", sport: "Football", date: "2024-11-18", time: "03:00 PM", venue: "Main Stadium", type: "Finals" },
  { id: "10", sport: "Basketball", date: "2024-11-18", time: "05:00 PM", venue: "Main Stadium", type: "Finals" },
];

export const convenors: SportsConvenor[] = [
  { id: "1", name: "John Kamau", sport: "Football", phone: "+254 712 345 678", email: "j.kamau@fof.co.ke" },
  { id: "2", name: "Sarah Wanjiku", sport: "Basketball", phone: "+254 723 456 789", email: "s.wanjiku@fof.co.ke" },
  { id: "3", name: "David Omondi", sport: "Volleyball", phone: "+254 734 567 890", email: "d.omondi@fof.co.ke" },
  { id: "4", name: "Grace Akinyi", sport: "Athletics", phone: "+254 745 678 901", email: "g.akinyi@fof.co.ke" },
  { id: "5", name: "Peter Mwangi", sport: "Swimming", phone: "+254 756 789 012", email: "p.mwangi@fof.co.ke" },
  { id: "6", name: "Mary Njeri", sport: "Table Tennis", phone: "+254 767 890 123", email: "m.njeri@fof.co.ke" },
  { id: "7", name: "James Otieno", sport: "Badminton", phone: "+254 778 901 234", email: "j.otieno@fof.co.ke" },
  { id: "8", name: "Ruth Wambui", sport: "Cricket", phone: "+254 789 012 345", email: "r.wambui@fof.co.ke" },
];

export const communityContacts: CommunityContact[] = [
  { id: "1", community: "Nairobi Central", contactPerson: "Ahmed Hassan", phone: "+254 712 111 111", email: "nairobi.central@fof.co.ke" },
  { id: "2", community: "Westlands", contactPerson: "Jennifer Muthoni", phone: "+254 723 222 222", email: "westlands@fof.co.ke" },
  { id: "3", community: "Karen", contactPerson: "Michael Kiplagat", phone: "+254 734 333 333", email: "karen@fof.co.ke" },
  { id: "4", community: "Eastleigh", contactPerson: "Fatuma Mohamed", phone: "+254 745 444 444", email: "eastleigh@fof.co.ke" },
  { id: "5", community: "South B", contactPerson: "Patrick Ochieng", phone: "+254 756 555 555", email: "southb@fof.co.ke" },
  { id: "6", community: "Lavington", contactPerson: "Susan Wangari", phone: "+254 767 666 666", email: "lavington@fof.co.ke" },
];

export const sportsRules = {
  football: `**Football Rules - FOF 2024**

1. Each match will consist of two 30-minute halves
2. Teams must have 11 players on the field
3. Standard FIFA rules apply
4. Fair play and sportsmanship are mandatory
5. Yellow and red card system will be enforced`,

  basketball: `**Basketball Rules - FOF 2024**

1. Games consist of four 10-minute quarters
2. Five players per team on court
3. Standard FIBA rules apply
4. Shot clock: 24 seconds
5. Three-point line distance: 6.75m`,

  volleyball: `**Volleyball Rules - FOF 2024**

1. Best of 5 sets format
2. First four sets to 25 points, final set to 15
3. Six players per team
4. Standard FIVB rules apply
5. Rally point scoring system`,
};

export const departments = [
  { id: "1", name: "Event Coordination" },
  { id: "2", name: "Medical Support" },
  { id: "3", name: "Registration Desk" },
  { id: "4", name: "Hospitality" },
  { id: "5", name: "Technical Support" },
  { id: "6", name: "Security" },
  { id: "7", name: "Photography & Media" },
  { id: "8", name: "Logistics" },
];
