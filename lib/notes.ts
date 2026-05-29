import { query, sql } from '@/lib/db';

export type NoteType = 'note' | 'checklist' | 'idea';

type NoteWriteInput = {
  title: string;
  type: NoteType;
  content?: string;
  color?: string;
  tags?: string[];
  folder_id?: string;
};

type NoteUpdateInput = {
  title?: string;
  content?: string;
  color?: string;
  tags?: string[];
  folder_id?: string | null;
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
      'INSERT INTO notes (id, title, type, content, color, user_id, folder_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [noteId, input.title, input.type, input.content ?? null, input.color ?? null, input.userId, input.folder_id ?? null]
    ),
    ...tags.map((tag) =>
      sql.query('INSERT INTO note_tags (note_id, tag) VALUES ($1, $2)', [noteId, tag])
    ),
  ]);

  return getNoteById(noteId);
}

export async function updateNoteWithTags(id: string, input: NoteUpdateInput) {
  const tags = input.tags === undefined ? undefined : normalizeTags(input.tags);

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (input.title !== undefined) { setClauses.push(`title = $${idx++}`); values.push(input.title); }
  if (input.content !== undefined) { setClauses.push(`content = $${idx++}`); values.push(input.content); }
  if (input.color !== undefined) { setClauses.push(`color = $${idx++}`); values.push(input.color); }
  if ('folder_id' in input) { setClauses.push(`folder_id = $${idx++}`); values.push(input.folder_id ?? null); }

  if (setClauses.length === 0 && tags === undefined) return getNoteById(id);

  setClauses.push('updated_at = NOW()');
  values.push(id);

  const [updatedRows] = await sql.transaction([
    sql.query(
      `UPDATE notes SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING id`,
      [...values]
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
