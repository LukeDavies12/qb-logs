export type UserRole = 'Default' | 'Admin' | 'Read Only'

export interface User {
  id: number;
  email: string;
  password_hash: string;
  display_name: string | null;
  job_title: string;
  team_id: number;
  current_season_id: number | null;
  role: UserRole;
}

export interface Invite {
  id: number;
  created_at: Date;
  email: string;
  display_name: string;
  team_id: number;
  current_season_id: number | null;
  job_title: string;
  role: UserRole;
  status: 'Pending' | 'Accepted' | 'Declined';
  token: string;
  expires_at: Date;
}

export interface Session {
  id: string;
  user_id: number;
  created_at: Date;
  expires_at: Date;
}