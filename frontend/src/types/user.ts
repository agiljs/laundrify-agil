export type UserRole = "ADMIN" | "STAFF" | "CUSTOMER";
export type UserStatus = "ACTIVE" | "INACTIVE";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: "STAFF" | "CUSTOMER";
};

export type UpdateUserPayload = {
  name?: string;
  phone?: string;
  status?: UserStatus;
};
