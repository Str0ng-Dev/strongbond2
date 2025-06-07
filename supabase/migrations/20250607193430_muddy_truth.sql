/*
  # Fix infinite recursion in group_members RLS policies

  1. Security Changes
    - Drop existing problematic RLS policies on group_members table
    - Create new simplified policies that avoid circular dependencies
    - Ensure policies don't reference group_members table within themselves

  2. Policy Changes
    - Safe read access: Users can read their own memberships
    - Safe insert access: Users can only insert themselves as members
    - Safe delete access: Users can remove themselves from groups
    - Remove complex policies that cause recursion
*/

-- Drop all existing policies on group_members to start fresh
DROP POLICY IF EXISTS "Allow member to leave group" ON group_members;
DROP POLICY IF EXISTS "Safe insert access" ON group_members;
DROP POLICY IF EXISTS "Safe read access" ON group_members;

-- Create new simplified policies that avoid recursion

-- Users can read their own group memberships
CREATE POLICY "Users can read own memberships"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert themselves as group members
CREATE POLICY "Users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove themselves from groups
CREATE POLICY "Users can leave groups"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Group admins can manage group memberships (but only for their groups)
CREATE POLICY "Group admins can manage memberships"
  ON group_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups 
      WHERE groups.id = group_members.group_id 
      AND groups.created_by_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups 
      WHERE groups.id = group_members.group_id 
      AND groups.created_by_user_id = auth.uid()
    )
  );