import { NextResponse } from 'next/server';
import { createNoteWithTags, listNotes } from '@/lib/notes';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const noteSchema = z.object({
  title: z.string().trim().min(3, 'El titulo debe tener al menos 3 caracteres'),
  type: z.enum(['note', 'checklist', 'idea']),
  content: z.string().optional(),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  try {
    const uid = await verifyAuth(request);
    const notes = await listNotes(uid);

    return NextResponse.json(notes);
  } catch (error: any) {
    if (error.message?.includes('Authorization')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('ERROR EN GET /notes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const uid = await verifyAuth(request);
    const body = await request.json();
    const result = noteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.issues }, { status: 400 });
    }

    const note = await createNoteWithTags({ ...result.data, userId: uid });

    return NextResponse.json(note, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes('Authorization')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('ERROR AL CREAR NOTA:', error);
    return NextResponse.json({ error: 'Error al crear la nota' }, { status: 500 });
  }
}
