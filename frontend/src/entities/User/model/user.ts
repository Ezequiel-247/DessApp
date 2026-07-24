export type UserRole = "admin" | "student";

export interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  avatar?: string;
  role: UserRole;
  is_active: boolean;
}
