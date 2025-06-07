/*
  # Complete Database Schema for Devotional App

  1. New Tables
    - `users` - User profiles and preferences
    - `groups` - Group management with invite codes
    - `group_members` - Group membership tracking
    - `devotional_marketplace` - Available devotional plans
    - `user_devotional_plan` - User's current devotional progress
    - `devotionals` - Daily devotional content
    - `journal_entries` - User reflections and journal entries
    - `mentor_content` - Role-specific mentor guidance
    - `fitness_challenges` - Fitness content for devotionals

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Proper access control based on user relationships

  3. Features
    - UUID primary keys
    - Proper foreign key relationships
    - Timestamps for audit trails
    - Enum types for consistent data
    - Indexes for performance
*/

-- Create enum types
CREATE TYPE user_role_enum AS ENUM ('Dad', 'Mom', 'Son', 'Daughter', 'Single Man', 'Single Woman', 'Church Leader', 'Coach');
CREATE TYPE price_type_enum AS ENUM ('free', 'donation', 'paid');
CREATE TYPE emotion_tag_enum AS ENUM ('grateful', 'hopeful', 'peaceful', 'joyful', 'reflective', 'challenged', 'encouraged', 'confused', 'struggling');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  user_role user_role_enum NOT NULL,
  fitness_enabled boolean DEFAULT false,
  group_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text UNIQUE NOT NULL,
  created_by_user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Group Members table
CREATE TABLE IF NOT EXISTS group_members (
  group_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamptz DEFAULT now(),
  is_admin boolean DEFAULT false,
  PRIMARY KEY (group_id, user_id)
);

-- Devotional Marketplace table
CREATE TABLE IF NOT EXISTS devotional_marketplace (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  description text NOT NULL,
  price_type price_type_enum DEFAULT 'free',
  price decimal(10,2),
  image_url text,
  tags text[] DEFAULT '{}',
  duration_days integer DEFAULT 30,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Devotional Plan table
CREATE TABLE IF NOT EXISTS user_devotional_plan (
  user_id uuid NOT NULL,
  devotional_id uuid NOT NULL,
  start_date date DEFAULT CURRENT_DATE,
  current_day integer DEFAULT 1,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, devotional_id)
);

-- Devotionals table (daily content)
CREATE TABLE IF NOT EXISTS devotionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devotional_plan_id uuid NOT NULL,
  day_number integer NOT NULL,
  title text NOT NULL,
  scripture text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(devotional_plan_id, day_number)
);

-- Journal Entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  devotional_id uuid NOT NULL,
  day_number integer NOT NULL,
  entry_text text NOT NULL,
  is_shared boolean DEFAULT false,
  emotion_tag emotion_tag_enum,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Mentor Content table
CREATE TABLE IF NOT EXISTS mentor_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devotional_id uuid NOT NULL,
  day_number integer NOT NULL,
  user_role user_role_enum NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  video_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(devotional_id, day_number, user_role)
);

-- Fitness Challenges table
CREATE TABLE IF NOT EXISTS fitness_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devotional_id uuid NOT NULL,
  day_number integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  duration text NOT NULL,
  difficulty text DEFAULT 'Medium',
  strong_variation text NOT NULL,
  stronger_variation text NOT NULL,
  strongest_variation text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(devotional_id, day_number)
);

-- Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT fk_users_group FOREIGN KEY (group_id) REFERENCES groups(id);
ALTER TABLE groups ADD CONSTRAINT fk_groups_creator FOREIGN KEY (created_by_user_id) REFERENCES users(id);
ALTER TABLE group_members ADD CONSTRAINT fk_group_members_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE group_members ADD CONSTRAINT fk_group_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_devotional_plan ADD CONSTRAINT fk_user_plan_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_devotional_plan ADD CONSTRAINT fk_user_plan_devotional FOREIGN KEY (devotional_id) REFERENCES devotional_marketplace(id) ON DELETE CASCADE;
ALTER TABLE devotionals ADD CONSTRAINT fk_devotionals_plan FOREIGN KEY (devotional_plan_id) REFERENCES devotional_marketplace(id) ON DELETE CASCADE;
ALTER TABLE journal_entries ADD CONSTRAINT fk_journal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE journal_entries ADD CONSTRAINT fk_journal_devotional FOREIGN KEY (devotional_id) REFERENCES devotional_marketplace(id) ON DELETE CASCADE;
ALTER TABLE mentor_content ADD CONSTRAINT fk_mentor_devotional FOREIGN KEY (devotional_id) REFERENCES devotional_marketplace(id) ON DELETE CASCADE;
ALTER TABLE fitness_challenges ADD CONSTRAINT fk_fitness_devotional FOREIGN KEY (devotional_id) REFERENCES devotional_marketplace(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_group_id ON users(group_id);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_devotional_marketplace_tags ON devotional_marketplace USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_devotional_marketplace_price_type ON devotional_marketplace(price_type);
CREATE INDEX IF NOT EXISTS idx_user_devotional_plan_user ON user_devotional_plan(user_id);
CREATE INDEX IF NOT EXISTS idx_devotionals_plan_day ON devotionals(devotional_plan_id, day_number);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_devotional ON journal_entries(user_id, devotional_id);
CREATE INDEX IF NOT EXISTS idx_mentor_content_devotional_role ON mentor_content(devotional_id, user_role);
CREATE INDEX IF NOT EXISTS idx_fitness_challenges_devotional_day ON fitness_challenges(devotional_id, day_number);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotional_marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devotional_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for groups table
CREATE POLICY "Users can read groups they belong to"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Group admins can update groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for group_members table
CREATE POLICY "Users can read group members of their groups"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for devotional_marketplace table
CREATE POLICY "Anyone can read devotional marketplace"
  ON devotional_marketplace
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_devotional_plan table
CREATE POLICY "Users can read own devotional plans"
  ON user_devotional_plan
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own devotional plans"
  ON user_devotional_plan
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for devotionals table
CREATE POLICY "Users can read devotional content"
  ON devotionals
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for journal_entries table
CREATE POLICY "Users can read own journal entries"
  ON journal_entries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read shared journal entries from group members"
  ON journal_entries
  FOR SELECT
  TO authenticated
  USING (
    is_shared = true AND user_id IN (
      SELECT gm1.user_id FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own journal entries"
  ON journal_entries
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for mentor_content table
CREATE POLICY "Users can read mentor content"
  ON mentor_content
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for fitness_challenges table
CREATE POLICY "Users can read fitness challenges"
  ON fitness_challenges
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-generate invite codes for groups
CREATE OR REPLACE FUNCTION set_group_invite_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    LOOP
      NEW.invite_code := generate_invite_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM groups WHERE invite_code = NEW.invite_code);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating invite codes
CREATE TRIGGER trigger_set_group_invite_code
  BEFORE INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION set_group_invite_code();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_devotional_marketplace_updated_at
  BEFORE UPDATE ON devotional_marketplace
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_devotional_plan_updated_at
  BEFORE UPDATE ON user_devotional_plan
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();