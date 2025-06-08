/*
  # Create pending_invites table for user invitation system

  1. New Table
    - `pending_invites` - Store pending user invitations with invite codes
    - Supports inviting users by role and first name
    - Tracks who created the invite and who used it

  2. Security
    - Enable RLS on pending_invites table
    - Add policies for authenticated users to manage invites
    - Users can create invites and see their own invites
    - Users can use invites (mark them as used)

  3. Features
    - UUID primary key with auto-generation
    - Unique invite codes
    - Foreign key relationships to users table
    - Timestamps for creation and usage tracking
    - Indexes for performance
*/

-- Create the pending_invites table
CREATE TABLE IF NOT EXISTS pending_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code text UNIQUE NOT NULL,
  inviter_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_role user_role_enum NOT NULL,
  invited_first_name text,
  created_at timestamptz DEFAULT now(),
  used_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  used_at timestamptz
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_invites_invite_code ON pending_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_pending_invites_inviter ON pending_invites(inviter_user_id);
CREATE INDEX IF NOT EXISTS idx_pending_invites_used_by ON pending_invites(used_by_user_id);
CREATE INDEX IF NOT EXISTS idx_pending_invites_created_at ON pending_invites(created_at);

-- Enable Row Level Security
ALTER TABLE pending_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pending_invites table

-- Users can create invites
CREATE POLICY "Users can create invites"
  ON pending_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (inviter_user_id = auth.uid());

-- Users can read their own created invites
CREATE POLICY "Users can read own created invites"
  ON pending_invites
  FOR SELECT
  TO authenticated
  USING (inviter_user_id = auth.uid());

-- Users can read invites they have used
CREATE POLICY "Users can read invites they used"
  ON pending_invites
  FOR SELECT
  TO authenticated
  USING (used_by_user_id = auth.uid());

-- Users can read unused invites by invite code (for accepting invites)
CREATE POLICY "Users can read unused invites by code"
  ON pending_invites
  FOR SELECT
  TO authenticated
  USING (used_by_user_id IS NULL);

-- Users can update invites to mark them as used
CREATE POLICY "Users can mark invites as used"
  ON pending_invites
  FOR UPDATE
  TO authenticated
  USING (used_by_user_id IS NULL)
  WITH CHECK (used_by_user_id = auth.uid());

-- Users can delete their own unused invites
CREATE POLICY "Users can delete own unused invites"
  ON pending_invites
  FOR DELETE
  TO authenticated
  USING (inviter_user_id = auth.uid() AND used_by_user_id IS NULL);

-- Create function to generate unique invite codes for pending invites
CREATE OR REPLACE FUNCTION generate_pending_invite_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP  -- 8 characters for pending invites to distinguish from group codes
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-generate invite codes for pending invites
CREATE OR REPLACE FUNCTION set_pending_invite_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    LOOP
      NEW.invite_code := generate_pending_invite_code();
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM pending_invites WHERE invite_code = NEW.invite_code
      ) AND NOT EXISTS (
        SELECT 1 FROM groups WHERE invite_code = NEW.invite_code
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating invite codes
CREATE TRIGGER trigger_set_pending_invite_code
  BEFORE INSERT ON pending_invites
  FOR EACH ROW
  EXECUTE FUNCTION set_pending_invite_code();

-- Create function to clean up old unused invites (optional - can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_old_pending_invites()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete unused invites older than 30 days
  DELETE FROM pending_invites 
  WHERE used_by_user_id IS NULL 
    AND created_at < now() - interval '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users for cleanup function
GRANT EXECUTE ON FUNCTION cleanup_old_pending_invites TO authenticated;