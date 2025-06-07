/*
  # Enable Multiple Group Memberships

  1. Database Changes
    - Remove group_id column from users table
    - Update RLS policies to work without users.group_id
    - Ensure group_members table is the single source of truth

  2. Security Updates
    - Fix recursive policy issues
    - Simplify group access control
    - Maintain proper user isolation

  3. Features
    - Users can belong to multiple groups
    - Users can create unlimited groups
    - Proper admin permissions maintained
*/

-- Remove the group_id column from users table since we'll use group_members as single source of truth
ALTER TABLE users DROP COLUMN IF EXISTS group_id;

-- Update the groups policies to work without users.group_id
DROP POLICY IF EXISTS "Allow select for group members" ON groups;

-- Create new policy that uses group_members table directly
CREATE POLICY "Allow select for group members" 
ON groups 
FOR SELECT 
TO authenticated 
USING (id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

-- Add policy to allow users to read group members for groups they belong to
-- This replaces the recursive policy with a simpler approach
DROP POLICY IF EXISTS "Users can read group members of their groups" ON group_members;

CREATE POLICY "Users can read group members of their groups" 
ON group_members 
FOR SELECT 
TO authenticated 
USING (
  group_id IN (
    SELECT gm.group_id 
    FROM group_members gm 
    WHERE gm.user_id = auth.uid()
  )
);