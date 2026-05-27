import { query, sql } from '@/lib/db';

export type NoteType = 'note' | 'checklist' | 'idea';

type NoteWriteInput = {
  title: string;
  type: NoteType;
  content?: string;
  color?: string;
  tags?: string[];
};

type NoteUpdateInput = {
  title?: string;
  content?: string;
  color?: string;
  tags?: string[];
};

const NOTE_WITH_RELATIONS_SELECT = `
  SELECT
    n.*,
    COALESCE(
      (
        SELECT json_agg(ci ORDER BY ci.id)
        FROM checklist_items ci
        WHERE ci.note_id = n.id
      ),
      '[]'::json
    ) AS items,
    COALESCE(
      (
        SELECT json_agg(nt.tag ORDER BY nt.tag)
        FROM note_tags nt
        WHERE nt.note_id = n.id
      ),
      '[]'::json
    ) AS tags
  FROM notes n
`;

export function normalizeTags(tags?: string[]) {
  if (!tags) {
    return [];
  }

  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
}

export async function listNotes(userId: string) {
  return query(
    `${NOTE_WITH_RELATIONS_SELECT} WHERE n.user_id = $1 ORDER BY n.created_at DESC;`,
    [userId]
  );
}

export async function getNoteById(id: string, userId?: string) {
  const where = userId ? 'WHERE n.id = $1 AND n.user_id = $2' : 'WHERE n.id = $1';
  const params = userId ? [id, userId] : [id];
  const [note] = await query(`${NOTE_WITH_RELATIONS_SELECT} ${where};`, params);

  return note ?? null;
}

export async function createNoteWithTags(input: NoteWriteInput & { userId: string }) {
  const noteId = crypto.randomUUID();
  const tags = normalizeTags(input.tags);

  await sql.transaction([
    sql.query(
      'INSERT INTO notes (id, title, type, content, color, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [noteId, input.title, input.type, input.content ?? null, input.color ?? null, input.userId]
    ),
    ...tags.map((tag) =>
      sql.query('INSERT INTO note_tags (note_id, tag) VALUES ($1, $2)', [noteId, tag])
    ),
  ]);

  return getNoteById(noteId);
}

export async function updateNoteWithTags(id: string, input: NoteUpdateInput) {
  const tags = input.tags === undefined ? undefined : normalizeTags(input.tags);
  const [updatedRows] = await sql.transaction([
    sql.query(
      `UPDATE notes
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           color = COALESCE($3, color),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id`,
      [input.title, input.content, input.color, id]
    ),
    ...(tags === undefined
      ? []
      : [
          sql.query('DELETE FROM note_tags WHERE note_id = $1', [id]),
          ...tags.map((tag) =>
            sql.query(
              `INSERT INTO note_tags (note_id, tag)
               SELECT $1, $2
               WHERE EXISTS (SELECT 1 FROM notes WHERE id = $1)`,
              [id, tag]
            )
          ),
        ]),
  ]);

  if (!updatedRows[0]) {
    return null;
  }

  return getNoteById(id);
}
