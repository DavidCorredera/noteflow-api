import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';

const patchSchema = z.object({
  text: z.string().min(1, "El texto no puede estar vacío").optional(),
  is_completed: z.boolean().optional(),
  priority: z.enum(["none", "low", "medium", "high"]).optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const result = patchSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.issues }, { status: 400 });
    }

    const { is_completed, text, priority } = result.data;

    const [updatedItem] = await query(
      `UPDATE checklist_items
       SET is_completed = COALESCE($1, is_completed),
           text = COALESCE($2, text),
           priority = COALESCE($3, priority)
       WHERE id = $4 RETURNING *`,
      [is_completed, text, priority, itemId]
    );

    if (!updatedItem) return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    return NextResponse.json(updatedItem);
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const { itemId } = await params;
    const [deletedItem] = await query('DELETE FROM checklist_items WHERE id = $1 RETURNING id', [itemId]);
    if (!deletedItem) return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
