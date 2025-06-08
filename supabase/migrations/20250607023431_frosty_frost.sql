/*
  # Drop duplicate foreign key constraint

  1. Problem
    - The `user_devotional_plan` table has two foreign key constraints pointing to the same relationship
    - `fk_user_plan_devotional` and `fk_user_devotional_plan_devotional` both reference `devotional_marketplace(id)`
    - This causes Supabase PostgREST to throw an error when embedding related data

  2. Solution
    - Drop the `fk_user_plan_devotional` constraint
    - Keep only `fk_user_devotional_plan_devotional` for the relationship
    - This will allow proper embedding of devotional_marketplace data in queries
*/

-- Drop the duplicate foreign key constraint
ALTER TABLE user_devotional_plan 
DROP CONSTRAINT IF EXISTS fk_user_plan_devotional;