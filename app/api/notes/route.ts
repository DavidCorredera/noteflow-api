import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';

const noteSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  type: z.enum(['note', 'checklist', 'idea']),
  content: z.string().optional(),
  color: z.string().optional(),
});

export async function GET() {
  try {
    const notes = await query('SELECT * FROM notes ORDER BY created_at DESC');
    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = noteSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ errors: result.error.errors }, { status: 400 });
    }
    
    const { title, type, content, color } = result.data;
    
    const [note] = await query(
      'INSERT INTO notes (title, type, content, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, type, content, color]
    );
    
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear la nota' }, { status: 500 });
  }
}