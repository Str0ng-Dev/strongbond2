/*
  # Fix RLS infinite recursion for groups and group_members tables

  1. Security Changes
    - Drop existing problematic policies that cause recursion
    - Add new non-recursive policies for groups table
    - Add new non-recursive policies for group_members table
    - Ensure proper access control without circular dependencies

  2. Policy Changes
    - Groups: Allow creation, reading for members, updating by creator
    - Group Members: Allow self-insertion, self-reading, self-management
    - Remove any policies that query the same table they're protecting
*/

-- Drop existing policies that might be causing recursion
DROP POLICY IF EXISTS "Group admins can update groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Users can read groups they belong to" ON groups;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Users can read group members of their groups" ON group_members;

-- Ensure RLS is enabled
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- New non-recursive policies for groups table
CREATE POLICY "Allow authenticated users to create groups" 
ON groups 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Allow select for group members" 
ON groups 
FOR SELECT 
TO authenticated 
USING (id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

CREATE POLICY "Allow group creator to update" 
ON groups 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = created_by_user_id);

CREATE POLICY "Allow group creator to delete" 
ON groups 
FOR DELETE 
TO authenticated 
USING (auth.uid() = created_by_user_id);

-- New non-recursive policies for group_members table
CREATE POLICY "Allow insert for authenticated users" 
ON group_members 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow read if member" 
ON group_members 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Allow member to update their own record" 
ON group_members 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Allow member to delete their own record" 
ON group_members 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);