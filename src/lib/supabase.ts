import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          first_name: string;
          user_role: 'Dad' | 'Mom' | 'Son' | 'Daughter' | 'Single Man' | 'Single Woman' | 'Church Leader' | 'Coach';
          fitness_enabled: boolean;
          created_at: string;
          updated_at: string;
          linked_to_user_id: string | null;
        };
        Insert: {
          id?: string;
          first_name: string;
          user_role: 'Dad' | 'Mom' | 'Son' | 'Daughter' | 'Single Man' | 'Single Woman' | 'Church Leader' | 'Coach';
          fitness_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
          linked_to_user_id?: string | null;
        };
        Update: {
          id?: string;
          first_name?: string;
          user_role?: 'Dad' | 'Mom' | 'Son' | 'Daughter' | 'Single Man' | 'Single Woman' | 'Church Leader' | 'Coach';
          fitness_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
          linked_to_user_id?: string | null;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_by_user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code?: string;
          created_by_user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_by_user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          joined_at: string;
          is_admin: boolean;
        };
        Insert: {
          group_id: string;
          user_id: string;
          joined_at?: string;
          is_admin?: boolean;
        };
        Update: {
          group_id?: string;
          user_id?: string;
          joined_at?: string;
          is_admin?: boolean;
        };
      };
      user_devotional_plan: {
        Row: {
          id: string;
          user_id: string;
          devotional_id: string;
          start_date: string;
          current_day: number;
          completed: boolean;
          created_at: string;
          updated_at: string;
          is_active: boolean;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          devotional_id: string;
          start_date?: string;
          current_day?: number;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          devotional_id?: string;
          start_date?: string;
          current_day?: number;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          completed_at?: string | null;
        };
      };
    };
  };
}