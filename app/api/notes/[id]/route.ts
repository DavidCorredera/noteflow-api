import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getNoteById, updateNoteWithTags } from '@/lib/notes';
import { z } from 'zod';

const notePatchSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const note = await getNoteById(id);
    if (!note) return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });
    return NextResponse.json(note);
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = notePatchSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.issues }, { status: 400 });
    }

    const updatedNote = await updateNoteWithTags(id, result.data);

    if (!updatedNote) return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });
    return NextResponse.json(updatedNote);
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [deletedNote] = await query('DELETE FROM notes WHERE id = $1 RETURNING id', [id]);
    if (!deletedNote) return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
