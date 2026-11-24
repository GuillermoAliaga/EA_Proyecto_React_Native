export const ROLES = ['USER', 'ADMIN', 'STORE_HOST'] as const;
export type Role = (typeof ROLES)[number];
export type UserRole = Role;

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  deleted?: boolean;
  isBanned?: boolean;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface UserInput {
  name: string;
  email: string;
  role: Role;
  password?: string;
}
