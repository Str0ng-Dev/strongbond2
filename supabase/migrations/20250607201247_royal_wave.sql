/*
  # Rename is_admin to is_owner in group_members table

  1. Database Changes
    - Rename is_admin column to is_owner in group_members table
    - Update all existing data to maintain consistency
    - Update RLS policies to use new column name

  2. Semantic Changes
    - Better reflects ownership semantics
    - Aligns with group ownership model
    - More intuitive naming convention
*/

-- Rename the column from is_admin to is_owner
ALTER TABLE group_members 
RENAME COLUMN is_admin TO is_owner;

-- Update any existing policies that reference is_admin
-- (The policies should automatically work with the renamed column)

-- Add a comment to document the change
COMMENT ON COLUMN group_members.is_owner IS 'Indicates if the user is an owner/admin of the group';