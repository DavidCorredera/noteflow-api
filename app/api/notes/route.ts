import { NextResponse } from 'next/server';
import { createNoteWithTags, listNotes } from '@/lib/notes';
import { z } from 'zod';

const noteSchema = z.object({
  title: z.string().trim().min(3, 'El titulo debe tener al menos 3 caracteres'),
  type: z.enum(['note', 'checklist', 'idea']),
  content: z.string().optional(),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const notes = await listNotes();

    return NextResponse.json(notes);
  } catch (error) {
    console.error('ERROR EN GET /notes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = noteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.issues }, { status: 400 });
    }

    const note = await createNoteWithTags(result.data);

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('ERROR AL CREAR NOTA:', error);
    return NextResponse.json({ error: 'Error al crear la nota' }, { status: 500 });
  }
}
