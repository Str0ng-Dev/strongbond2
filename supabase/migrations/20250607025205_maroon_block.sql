/*
  # Add id column to user_devotional_plan table

  1. Changes
    - Add `id` column as uuid with default gen_random_uuid()
    - Set `id` as the new primary key
    - Keep existing unique constraint on (user_id, devotional_id)
    - Preserve all existing data and constraints

  2. Notes
    - This maintains backward compatibility while adding the expected id column
    - The composite unique constraint ensures no duplicate user-devotional combinations
*/

-- Add the id column with default value
ALTER TABLE user_devotional_plan 
ADD COLUMN id uuid DEFAULT gen_random_uuid();

-- Update all existing rows to have an id
UPDATE user_devotional_plan 
SET id = gen_random_uuid() 
WHERE id IS NULL;

-- Make the id column NOT NULL
ALTER TABLE user_devotional_plan 
ALTER COLUMN id SET NOT NULL;

-- Drop the existing primary key constraint
ALTER TABLE user_devotional_plan 
DROP CONSTRAINT user_devotional_plan_pkey;

-- Add the new primary key on id
ALTER TABLE user_devotional_plan 
ADD CONSTRAINT user_devotional_plan_pkey PRIMARY KEY (id);

-- Add a unique constraint on the original composite key to maintain data integrity
ALTER TABLE user_devotional_plan 
ADD CONSTRAINT user_devotional_plan_user_devotional_unique UNIQUE (user_id, devotional_id);