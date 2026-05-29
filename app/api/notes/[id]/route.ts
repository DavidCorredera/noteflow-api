import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getNoteById, updateNoteWithTags } from '@/lib/notes';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const notePatchSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().uuid().nullable().optional(),
});

function unauthorized() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const uid = await verifyAuth(request);
    const { id } = await params;
    const note = await getNoteById(id, uid);
    if (!note) return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });
    return NextResponse.json(note);
  } catch (error: any) {
    if (error.message?.includes('Authorization')) return unauthorized();
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const uid = await verifyAuth(request);
    const { id } = await params;

    const existing = await getNoteById(id, uid);
    if (!existing) return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });

    const body = await request.json();
    const result = notePatchSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.issues }, { status: 400 });
    }

    const updatedNote = await updateNoteWithTags(id, { ...result.data, folder_id: result.data.folderId === undefined ? undefined : result.data.folderId });
    if (!updatedNote) return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });
    return NextResponse.json(updatedNote);
  } catch (error: any) {
    if (error.message?.includes('Authorization')) return unauthorized();
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const uid = await verifyAuth(request);
    const { id } = await params;

    const existing = await getNoteById(id, uid);
    if (!existing) return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });

    const [deletedNote] = await query('DELETE FROM notes WHERE id = $1 RETURNING id', [id]);
    if (!deletedNote) return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.message?.includes('Authorization')) return unauthorized();
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
