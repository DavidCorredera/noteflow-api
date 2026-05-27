-- Add user_id column to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id VARCHAR(128);

-- Index for fast queries by user
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);

-- Backfill existing rows with 'legacy' (they belong to the original single user)
UPDATE notes SET user_id = 'legacy' WHERE user_id IS NULL;

-- Make user_id required for new rows
ALTER TABLE notes ALTER COLUMN user_id SET NOT NULL;
