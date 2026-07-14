export interface User {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  family_id: string | null;
  family_role: 'admin' | 'member' | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

// What we return to the client — never include password_hash
export interface UserPublic {
  id: string;
  email: string;
  display_name: string;
  family_id: string | null;
  family_role: 'admin' | 'member' | null;
}

// What the register endpoint expects in the request body
export interface RegisterInput {
  email: string;
  password: string;
  display_name: string;
}

// What the login endpoint expects in the request body
export interface LoginInput {
  email: string;
  password: string;
}