/*
  # Add User Linking Feature

  1. Database Changes
    - Add linked_to_user_id column to users table
    - Add foreign key constraint for referential integrity
    - Add index for performance
    - Create bidirectional view for user connections

  2. Security
    - Add RLS policies for linked user relationships
    - Enable secure access to connected users' basic info
    - Create view-level security for user connections

  3. Features
    - Support for one-to-one user relationships
    - Bidirectional connection visibility
    - Role-based connection types
*/

-- Add the linked_to_user_id column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'linked_to_user_id'
  ) THEN
    ALTER TABLE users ADD COLUMN linked_to_user_id uuid;
  END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_users_linked_to_user'
      AND table_name = 'users'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT fk_users_linked_to_user 
    FOREIGN KEY (linked_to_user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for the new linked_to_user_id column
CREATE INDEX IF NOT EXISTS idx_users_linked_to_user_id ON users(linked_to_user_id);

-- Drop existing conflicting policy if it exists
DROP POLICY IF EXISTS "Users can read linked user basic info" ON users;

-- Add RLS policy for linked user relationships
CREATE POLICY "Users can read linked user basic info"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    auth.uid() = linked_to_user_id OR
    id = (SELECT linked_to_user_id FROM users WHERE id = auth.uid())
  );

-- Create a view for user connections (bidirectional)
CREATE OR REPLACE VIEW user_connections AS
SELECT 
  u1.id as user_id,
  u1.first_name as user_name,
  u1.user_role as user_role,
  u2.id as connected_user_id,
  u2.first_name as connected_user_name,
  u2.user_role as connected_user_role,
  'linked_to' as connection_type
FROM users u1
JOIN users u2 ON u1.linked_to_user_id = u2.id
WHERE u1.linked_to_user_id IS NOT NULL

UNION ALL

SELECT 
  u2.id as user_id,
  u2.first_name as user_name,
  u2.user_role as user_role,
  u1.id as connected_user_id,
  u1.first_name as connected_user_name,
  u1.user_role as connected_user_role,
  'linked_from' as connection_type
FROM users u1
JOIN users u2 ON u1.linked_to_user_id = u2.id
WHERE u1.linked_to_user_id IS NOT NULL;

-- Note: Views don't support RLS directly in PostgreSQL
-- Instead, we'll create a function to get user connections with proper security

-- Create a secure function to get user connections
CREATE OR REPLACE FUNCTION get_user_connections(target_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  user_id uuid,
  user_name text,
  user_role user_role_enum,
  connected_user_id uuid,
  connected_user_name text,
  connected_user_role user_role_enum,
  connection_type text
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow users to see their own connections
  IF target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: can only view own connections';
  END IF;

  RETURN QUERY
  SELECT 
    u1.id,
    u1.first_name,
    u1.user_role,
    u2.id,
    u2.first_name,
    u2.user_role,
    'linked_to'::text
  FROM users u1
  JOIN users u2 ON u1.linked_to_user_id = u2.id
  WHERE u1.id = target_user_id AND u1.linked_to_user_id IS NOT NULL

  UNION ALL

  SELECT 
    u2.id,
    u2.first_name,
    u2.user_role,
    u1.id,
    u1.first_name,
    u1.user_role,
    'linked_from'::text
  FROM users u1
  JOIN users u2 ON u1.linked_to_user_id = u2.id
  WHERE u2.id = target_user_id AND u1.linked_to_user_id IS NOT NULL;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_connections TO authenticated;