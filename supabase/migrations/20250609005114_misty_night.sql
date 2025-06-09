/*
  # Add OpenAI thread ID to AI conversations

  1. Schema Changes
    - Add `thread_id` column to `ai_conversations` table
    - This will store the OpenAI thread ID for maintaining conversation context
    - Column is nullable to support existing conversations

  2. Index
    - Add index on thread_id for faster lookups

  3. Notes
    - Existing conversations will have NULL thread_id initially
    - New conversations will populate this field when created
*/

-- Add thread_id column to ai_conversations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_conversations' AND column_name = 'thread_id'
  ) THEN
    ALTER TABLE ai_conversations ADD COLUMN thread_id text;
  END IF;
END $$;

-- Add index for faster thread_id lookups
CREATE INDEX IF NOT EXISTS idx_ai_conversations_thread_id 
ON ai_conversations USING btree (thread_id);

-- Add comment for documentation
COMMENT ON COLUMN ai_conversations.thread_id IS 'OpenAI thread ID for maintaining conversation context';