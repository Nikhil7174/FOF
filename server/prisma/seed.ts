import { PrismaClient, Role, Gender, ParticipantStatus, SportType } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log("Seeding database...");

  // Clear existing data (optional - comment out if you want to keep existing data)
  // await prisma.email.deleteMany();
  // await prisma.calendarItem.deleteMany();
  // await prisma.participantSport.deleteMany();
  // await prisma.participant.deleteMany();
  // await prisma.volunteer.deleteMany();
  // await prisma.user.deleteMany();
  // await prisma.sport.deleteMany();
  // await prisma.community.deleteMany();
  // await prisma.department.deleteMany();
  // await prisma.settings.deleteMany();

  // Create departments
  const dept1 = await prisma.department.upsert({
    where: { id: "d1" },
    update: {},
    create: {
      id: "d1",
      name: "Event Coordination",
    },
  });

  const dept2 = await prisma.department.upsert({
    where: { id: "d2" },
    update: {},
    create: {
      id: "d2",
      name: "Medical Support",
    },
  });

  // Create communities
  const comm1 = await prisma.community.upsert({
    where: { id: "1" },
    update: {},
    create: {
      id: "1",
      name: "Nairobi Central",
      active: true,
      contactPerson: "Ahmed Hassan",
      phone: "+254 712 111 111",
      email: "nairobi.central@fof.co.ke",
    },
  });

  const comm2 = await prisma.community.upsert({
    where: { id: "2" },
    update: {},
    create: {
      id: "2",
      name: "Westlands",
      active: true,
      contactPerson: "Jennifer Muthoni",
      phone: "+254 723 222 222",
      email: "westlands@fof.co.ke",
    },
  });

  // Create sports
  const sport1 = await prisma.sport.upsert({
    where: { id: "1" },
    update: {},
    create: {
      id: "1",
      name: "Football",
      active: true,
      type: SportType.team,
      requiresTeamName: true,
    },
  });

  const sport2 = await prisma.sport.upsert({
    where: { id: "2" },
    update: {},
    create: {
      id: "2",
      name: "Basketball",
      active: true,
      type: SportType.team,
      requiresTeamName: true,
    },
  });

  const sport4 = await prisma.sport.upsert({
    where: { id: "4" },
    update: {},
    create: {
      id: "4",
      name: "Athletics",
      active: true,
      type: SportType.individual,
      requiresTeamName: false,
    },
  });

  const sport10 = await prisma.sport.upsert({
    where: { id: "10" },
    update: {},
    create: {
      id: "10",
      name: "Badminton",
      active: true,
      type: SportType.individual,
      requiresTeamName: false,
    },
  });

  await prisma.sport.upsert({
    where: { id: "10a" },
    update: {},
    create: {
      id: "10a",
      name: "Singles",
      active: true,
      type: SportType.individual,
      requiresTeamName: false,
      parentId: "10",
    },
  });

  await prisma.sport.upsert({
    where: { id: "10b" },
    update: {},
    create: {
      id: "10b",
      name: "Doubles",
      active: true,
      type: SportType.team,
      requiresTeamName: false,
      parentId: "10",
    },
  });

  await prisma.sport.upsert({
    where: { id: "10c" },
    update: {},
    create: {
      id: "10c",
      name: "Mixed Doubles",
      active: true,
      type: SportType.team,
      requiresTeamName: false,
      parentId: "10",
    },
  });

  const sport11 = await prisma.sport.upsert({
    where: { id: "11" },
    update: {},
    create: {
      id: "11",
      name: "Darts",
      active: true,
      type: SportType.individual,
      requiresTeamName: false,
    },
  });

  await prisma.sport.upsert({
    where: { id: "11a" },
    update: {},
    create: {
      id: "11a",
      name: "Singles",
      active: true,
      type: SportType.individual,
      requiresTeamName: false,
      parentId: "11",
    },
  });

  await prisma.sport.upsert({
    where: { id: "11b" },
    update: {},
    create: {
      id: "11b",
      name: "Doubles",
      active: true,
      type: SportType.team,
      requiresTeamName: false,
      parentId: "11",
    },
  });

  // Create users with hashed passwords
  const adminPassword = await hashPassword("admin");
  await prisma.user.upsert({
    where: { id: "u1" },
    update: {},
    create: {
      id: "u1",
      username: "admin",
      email: "admin@fof.co.ke",
      password: adminPassword,
      role: Role.admin,
    },
  });

  const communityPassword = await hashPassword("community");
  await prisma.user.upsert({
    where: { id: "c1" },
    update: {},
    create: {
      id: "c1",
      username: "commadmin1",
      email: "commadmin1@fof.co.ke",
      password: communityPassword,
      role: Role.community_admin,
      communityId: "1",
    },
  });

  await prisma.user.upsert({
    where: { id: "c2" },
    update: {},
    create: {
      id: "c2",
      username: "commadmin2",
      email: "commadmin2@fof.co.ke",
      password: communityPassword,
      role: Role.community_admin,
      communityId: "2",
    },
  });

  const footballPassword = await hashPassword("football");
  await prisma.user.upsert({
    where: { id: "s1" },
    update: {},
    create: {
      id: "s1",
      username: "footballadmin",
      email: "football@fof.co.ke",
      password: footballPassword,
      role: Role.sports_admin,
      sportId: "1",
    },
  });

  const basketballPassword = await hashPassword("basketball");
  await prisma.user.upsert({
    where: { id: "s2" },
    update: {},
    create: {
      id: "s2",
      username: "basketballadmin",
      email: "basketball@fof.co.ke",
      password: basketballPassword,
      role: Role.sports_admin,
      sportId: "2",
    },
  });

  const athleticsPassword = await hashPassword("athletics");
  await prisma.user.upsert({
    where: { id: "s3" },
    update: {},
    create: {
      id: "s3",
      username: "athleticsadmin",
      email: "athletics@fof.co.ke",
      password: athleticsPassword,
      role: Role.sports_admin,
      sportId: "4",
    },
  });

  const badmintonPassword = await hashPassword("badminton");
  await prisma.user.upsert({
    where: { id: "s4" },
    update: {},
    create: {
      id: "s4",
      username: "badmintonadmin",
      email: "badminton@fof.co.ke",
      password: badmintonPassword,
      role: Role.sports_admin,
      sportId: "10",
    },
  });

  const voladminPassword = await hashPassword("voladmin");
  await prisma.user.upsert({
    where: { id: "vadmin" },
    update: {},
    create: {
      id: "vadmin",
      username: "voladmin",
      email: "voladmin@fof.co.ke",
      password: voladminPassword,
      role: Role.volunteer_admin,
    },
  });

  const volunteerPassword = await hashPassword("volunteer");
  await prisma.user.upsert({
    where: { id: "v1" },
    update: {},
    create: {
      id: "v1",
      username: "volunteer",
      email: "volunteer@fof.co.ke",
      password: volunteerPassword,
      role: Role.volunteer,
    },
  });

  const userPassword = await hashPassword("user");
  await prisma.user.upsert({
    where: { id: "u2" },
    update: {},
    create: {
      id: "u2",
      username: "user",
      email: "user@fof.co.ke",
      password: userPassword,
      role: Role.user,
    },
  });

  // Create participants
  const participant1 = await prisma.participant.upsert({
    where: { id: "p1" },
    update: {},
    create: {
      id: "p1",
      firstName: "Asha",
      lastName: "Mwangi",
      gender: Gender.female,
      dob: new Date("2004-05-12"),
      email: "asha.mwangi@example.com",
      phone: "+254711000001",
      communityId: "1",
      nextOfKin: {
        firstName: "Mary",
        lastName: "Mwangi",
        phone: "+254711222333",
      },
      status: ParticipantStatus.pending,
      teamName: "Nairobi Queens",
    },
  });

  await prisma.participantSport.create({
    data: {
      participantId: participant1.id,
      sportId: "1",
    },
  });

  const participant2 = await prisma.participant.upsert({
    where: { id: "p2" },
    update: {},
    create: {
      id: "p2",
      firstName: "Brian",
      lastName: "Otieno",
      gender: Gender.male,
      dob: new Date("2003-09-22"),
      email: "brian.otieno@example.com",
      phone: "+254711000002",
      communityId: "2",
      nextOfKin: {
        firstName: "Peter",
        lastName: "Otieno",
        phone: "+254722111444",
      },
      status: ParticipantStatus.accepted,
    },
  });

  await prisma.participantSport.createMany({
    data: [
      { participantId: participant2.id, sportId: "2" },
      { participantId: participant2.id, sportId: "4" },
    ],
  });

  // Create volunteers
  const volunteers = [
    {
      id: "vol1",
      firstName: "Grace",
      lastName: "Kariuki",
      gender: Gender.female,
      dob: new Date("1999-01-10"),
      email: "grace.kariuki@example.com",
      phone: "+254733100200",
      departmentId: "d1",
      sportId: "1",
    },
    {
      id: "vol2",
      firstName: "Hassan",
      lastName: "Ali",
      gender: Gender.male,
      dob: new Date("1997-07-18"),
      email: "hassan.ali@example.com",
      phone: "+254733100201",
      departmentId: "d2",
      sportId: "2",
    },
    {
      id: "vol3",
      firstName: "Linet",
      lastName: "Chebet",
      gender: Gender.female,
      dob: new Date("2000-03-03"),
      email: "linet.chebet@example.com",
      phone: "+254733100202",
      departmentId: "d1",
      sportId: "4",
    },
    {
      id: "vol4",
      firstName: "Peter",
      lastName: "Mwangi",
      gender: Gender.male,
      dob: new Date("1995-05-15"),
      email: "peter.mwangi@example.com",
      phone: "+254733100203",
      departmentId: "d1",
    },
    {
      id: "vol5",
      firstName: "Sarah",
      lastName: "Wanjiku",
      gender: Gender.female,
      dob: new Date("1998-08-22"),
      email: "sarah.wanjiku@example.com",
      phone: "+254733100204",
      departmentId: "d2",
    },
    {
      id: "vol6",
      firstName: "David",
      lastName: "Ochieng",
      gender: Gender.male,
      dob: new Date("1996-11-30"),
      email: "david.ochieng@example.com",
      phone: "+254733100205",
      departmentId: "d1",
    },
    {
      id: "vol7",
      firstName: "Mary",
      lastName: "Njeri",
      gender: Gender.female,
      dob: new Date("1999-02-14"),
      email: "mary.njeri@example.com",
      phone: "+254733100206",
      departmentId: "d2",
    },
    {
      id: "vol8",
      firstName: "James",
      lastName: "Kipchoge",
      gender: Gender.male,
      dob: new Date("1994-09-10"),
      email: "james.kipchoge@example.com",
      phone: "+254733100207",
      departmentId: "d1",
    },
    {
      id: "vol9",
      firstName: "Ruth",
      lastName: "Kamau",
      gender: Gender.female,
      dob: new Date("2001-06-25"),
      email: "ruth.kamau@example.com",
      phone: "+254733100208",
      departmentId: "d2",
    },
    {
      id: "vol10",
      firstName: "Michael",
      lastName: "Mutua",
      gender: Gender.male,
      dob: new Date("1997-12-05"),
      email: "michael.mutua@example.com",
      phone: "+254733100209",
      departmentId: "d1",
    },
  ];

  for (const vol of volunteers) {
    await prisma.volunteer.upsert({
      where: { id: vol.id },
      update: {},
      create: vol,
    });
  }

  // Create calendar items
  await prisma.calendarItem.upsert({
    where: { id: "e1" },
    update: {},
    create: {
      id: "e1",
      sportId: "1",
      date: new Date("2026-11-15"),
      time: "09:00",
      venue: "Main Stadium",
      type: "Qualifier",
    },
  });

  await prisma.calendarItem.upsert({
    where: { id: "e2" },
    update: {},
    create: {
      id: "e2",
      sportId: "2",
      date: new Date("2026-11-15"),
      time: "11:00",
      venue: "Sports Complex A",
      type: "Group",
    },
  });

  // Create settings
  await prisma.settings.upsert({
    where: { id: "1" },
    update: {},
    create: {
      id: "1",
      ageCalculatorDate: new Date("2026-11-01"),
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

