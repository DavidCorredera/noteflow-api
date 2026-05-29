-- Add missing indexes on foreign key columns for query performance

CREATE INDEX IF NOT EXISTS idx_checklist_items_note_id ON checklist_items(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
