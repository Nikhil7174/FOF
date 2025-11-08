import { Role, Gender, ParticipantStatus, SportType } from "@prisma/client";

export type { Role, Gender, ParticipantStatus, SportType };

export interface NextOfKin {
  firstName: string;
  middleName?: string;
  lastName: string;
  phone: string;
}

export interface AgeLimit {
  min?: number;
  max?: number;
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: Role;
}



