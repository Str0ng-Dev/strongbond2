/*
  # User Devotional Plan Table Setup

  1. Table Structure
    - Ensures user_devotional_plan table exists with all required fields
    - Adds any missing columns to existing table
    
  2. Constraints & Indexes
    - Foreign key constraints to users and devotional_marketplace
    - Unique constraint ensuring only one active plan per user
    - Performance indexes on key columns
    - Check constraint for positive current_day values
    
  3. Security
    - Enable RLS on user_devotional_plan table
    - Add policies for authenticated users to manage their own plans
    
  4. Triggers
    - Updated_at trigger for automatic timestamp updates
    - Single active plan trigger to enforce business rule
*/

-- First, ensure the table exists with basic structure
CREATE TABLE IF NOT EXISTS user_devotional_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  devotional_id uuid NOT NULL,
  start_date timestamptz DEFAULT now(),
  current_day integer DEFAULT 1,
  is_active boolean DEFAULT true,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add any missing columns to existing table
DO $$
BEGIN
  -- Add is_active column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_devotional_plan' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE user_devotional_plan ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  
  -- Add completed_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_devotional_plan' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE user_devotional_plan ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_user_devotional_plan_user'
      AND table_name = 'user_devotional_plan'
  ) THEN
    ALTER TABLE user_devotional_plan 
    ADD CONSTRAINT fk_user_devotional_plan_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_user_devotional_plan_devotional'
      AND table_name = 'user_devotional_plan'
  ) THEN
    ALTER TABLE user_devotional_plan 
    ADD CONSTRAINT fk_user_devotional_plan_devotional 
    FOREIGN KEY (devotional_id) REFERENCES devotional_marketplace(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add check constraint for positive current_day
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'check_current_day_positive'
      AND table_name = 'user_devotional_plan'
  ) THEN
    ALTER TABLE user_devotional_plan 
    ADD CONSTRAINT check_current_day_positive 
    CHECK (current_day > 0);
  END IF;
END $$;

-- Create unique partial index to ensure only one active plan per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_user_devotional_plan_active_unique'
      AND tablename = 'user_devotional_plan'
  ) THEN
    CREATE UNIQUE INDEX idx_user_devotional_plan_active_unique 
    ON user_devotional_plan (user_id) 
    WHERE is_active = true;
  END IF;
END $$;

-- Create indexes for performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_user_devotional_plan_user_id'
      AND tablename = 'user_devotional_plan'
  ) THEN
    CREATE INDEX idx_user_devotional_plan_user_id 
    ON user_devotional_plan (user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_user_devotional_plan_devotional_id'
      AND tablename = 'user_devotional_plan'
  ) THEN
    CREATE INDEX idx_user_devotional_plan_devotional_id 
    ON user_devotional_plan (devotional_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_user_devotional_plan_active'
      AND tablename = 'user_devotional_plan'
  ) THEN
    CREATE INDEX idx_user_devotional_plan_active 
    ON user_devotional_plan (is_active);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE user_devotional_plan ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can read own devotional plans" ON user_devotional_plan;
DROP POLICY IF EXISTS "Users can insert own devotional plans" ON user_devotional_plan;
DROP POLICY IF EXISTS "Users can update own devotional plans" ON user_devotional_plan;
DROP POLICY IF EXISTS "Users can delete own devotional plans" ON user_devotional_plan;

-- Create RLS policies
CREATE POLICY "Users can read own devotional plans"
  ON user_devotional_plan
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own devotional plans"
  ON user_devotional_plan
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own devotional plans"
  ON user_devotional_plan
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own devotional plans"
  ON user_devotional_plan
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create a function to automatically deactivate other plans when a new one is activated
CREATE OR REPLACE FUNCTION ensure_single_active_plan()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new/updated record is active, deactivate all other plans for this user
  IF NEW.is_active = true THEN
    UPDATE user_devotional_plan 
    SET is_active = false, updated_at = now()
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger
DO $$
BEGIN
  -- Drop existing trigger if it exists
  DROP TRIGGER IF EXISTS trigger_user_devotional_plan_updated_at ON user_devotional_plan;
  
  -- Create the trigger
  CREATE TRIGGER trigger_user_devotional_plan_updated_at
    BEFORE UPDATE ON user_devotional_plan
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Create trigger to ensure only one active plan per user
DO $$
BEGIN
  -- Drop existing trigger if it exists
  DROP TRIGGER IF EXISTS trigger_ensure_single_active_plan ON user_devotional_plan;
  
  -- Create the trigger
  CREATE TRIGGER trigger_ensure_single_active_plan
    BEFORE INSERT OR UPDATE ON user_devotional_plan
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_active_plan();
END $$;