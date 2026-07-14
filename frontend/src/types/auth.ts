export interface User {
  id: string;
  email: string;
  display_name: string;
  family_id: string | null;
  family_role: 'admin' | 'member' | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  display_name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}