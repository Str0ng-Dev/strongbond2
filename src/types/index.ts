export interface OnboardingData {
  first_name: string;
  user_role: string;
  fitness_enabled: boolean;
  group_action: string;
  invite_code?: string;
  email: string;
  password: string;
  user_id?: string;
  pending_invite_code?: string; // New field for pending invites
}

export interface User {
  id: string;
  first_name: string;
  user_role: 'Dad' | 'Mom' | 'Son' | 'Daughter' | 'Single Man' | 'Single Woman' | 'Church Leader' | 'Coach';
  fitness_enabled: boolean;
  linked_to_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
  is_owner: boolean; // Changed from is_admin to is_owner
}

export interface GroupWithMembers extends Group {
  group_members: (GroupMember & {
    users: {
      first_name: string;
      user_role: string;
    };
  })[];
}

export interface UserConnection {
  user_id: string;
  user_name: string;
  user_role: string;
  connected_user_id: string;
  connected_user_name: string;
  connected_user_role: string;
  connection_type: 'linked_to' | 'linked_from';
}

export interface PendingInvite {
  id: string;
  invite_code: string;
  inviter_user_id: string;
  invited_role: 'Dad' | 'Mom' | 'Son' | 'Daughter' | 'Single Man' | 'Single Woman' | 'Church Leader' | 'Coach';
  invited_first_name?: string;
  created_at: string;
  used_by_user_id?: string;
  used_at?: string;
}

export interface DevotionalPlan {
  id: string;
  title: string;
  author: string;
  description: string;
  price_type: 'free' | 'donation' | 'paid';
  price?: number;
  image_url?: string;
  tags: string[];
  duration_days: number;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  devotional_id: string;
  day_number: number;
  entry_text: string;
  is_shared: boolean;
  emotion_tag?: 'grateful' | 'hopeful' | 'peaceful' | 'joyful' | 'reflective' | 'challenged' | 'encouraged' | 'confused' | 'struggling';
  created_at: string;
  updated_at: string;
}

export interface CurrentPlan {
  id: string;
  plan_id: string;
  title: string;
  current_day: number;
  total_days: number;
  started_date: string;
}

export interface TodayContent {
  title: string;
  scripture: string;
  body: string;
  day: number;
}

export interface FitnessChallenge {
  title: string;
  description: string;
  duration: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}