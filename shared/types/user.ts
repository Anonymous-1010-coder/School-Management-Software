import type { Role } from '../constants/roles';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  otherName?: string;
  phone?: string;
  role: Role;
  avatar?: string;
  gender?: 'MALE' | 'FEMALE';
  dateOfBirth?: string;
  address?: string;
  isVerified: boolean;
  isTwoFactorEnabled: boolean;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile extends UserProfile {
  admissionNumber: string;
  currentClassId?: string;
  currentArmId?: string;
  guardianId?: string;
  enrollmentStatus: 'ACTIVE' | 'TRANSFERRED' | 'GRADUATED' | 'ALUMNI' | 'SUSPENDED' | 'EXPELED';
  admissionDate: string;
  session?: string;
  bloodGroup?: string;
  genotype?: string;
  medicalInfo?: string;
  religion?: string;
  nationality: string;
  stateOfOrigin?: string;
  lga?: string;
}

export interface StaffProfile extends UserProfile {
  staffNumber: string;
  department?: string;
  qualification?: string;
  specialization?: string;
  dateEmployed: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  salary?: number;
  isClassTeacher?: boolean;
}
