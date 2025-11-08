// Static display data for the application

export interface SportsConvenor {
  id: string;
  name: string;
  sport: string;
  phone: string;
  email: string;
}

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

export const sportsRules = {
  football: `**Football Rules - FOF 2026**

1. Each match will consist of two 30-minute halves
2. Teams must have 11 players on the field
3. Standard FIFA rules apply
4. Fair play and sportsmanship are mandatory
5. Yellow and red card system will be enforced`,

  basketball: `**Basketball Rules - FOF 2026**

1. Games consist of four 10-minute quarters
2. Five players per team on court
3. Standard FIBA rules apply
4. Shot clock: 24 seconds
5. Three-point line distance: 6.75m`,

  volleyball: `**Volleyball Rules - FOF 2026**

1. Best of 5 sets format
2. First four sets to 25 points, final set to 15
3. Six players per team
4. Standard FIVB rules apply
5. Rally point scoring system`,
};

