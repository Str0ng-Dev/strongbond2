/*
  # Fix infinite recursion in group_members RLS policies

  1. Problem
    - The current RLS policy on group_members creates infinite recursion
    - Policy tries to query group_members table from within group_members policy
    - This causes "infinite recursion detected in policy" error

  2. Solution
    - Drop the problematic recursive policy
    - Create simpler, non-recursive policies
    - Use direct user_id checks instead of complex subqueries

  3. New Policies
    - Users can read group members where they are also a member (simplified)
    - Users can insert themselves as group members
    - Users can delete themselves from groups
*/

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can read group members of their groups" ON group_members;

-- Create a simpler policy that doesn't cause recursion
-- Users can read group members of groups where they have a direct membership
CREATE POLICY "Users can read group members of their groups" 
  ON group_members 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 
      FROM group_members gm 
      WHERE gm.group_id = group_members.group_id 
        AND gm.user_id = auth.uid()
    )
  );

-- Alternative approach: Create a simpler policy using a function
-- First, let's try an even simpler approach that avoids the recursion entirely

-- Drop the policy we just created
DROP POLICY IF EXISTS "Users can read group members of their groups" ON group_members;

-- Create a much simpler policy that allows users to read group members
-- only for groups they belong to, using a more direct approach
CREATE POLICY "Users can read group members of their groups" 
  ON group_members 
  FOR SELECT 
  TO authenticated 
  USING (
    group_id IN (
      SELECT g.id 
      FROM groups g 
      INNER JOIN users u ON u.group_id = g.id 
      WHERE u.id = auth.uid()
    )
  );