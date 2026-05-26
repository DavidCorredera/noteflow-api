import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';

const itemSchema = z.object({
  text: z.string().min(1, "El texto no puede estar vacío"),
  priority: z.enum(["none", "low", "medium", "high"]).optional()
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const items = await query('SELECT * FROM checklist_items WHERE note_id = $1 ORDER BY id ASC', [id]);
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = itemSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.issues }, { status: 400 });
    }
 
    const [newItem] = await query(
      'INSERT INTO checklist_items (note_id, text, priority) VALUES ($1, $2, $3) RETURNING *',
      [id, result.data.text, result.data.priority ?? 'none']
    );

    return NextResponse.json(newItem, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
