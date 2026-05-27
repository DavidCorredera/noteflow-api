import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const patchSchema = z.object({
  text: z.string().min(1, "El texto no puede estar vacío").optional(),
  is_completed: z.boolean().optional(),
  priority: z.enum(["none", "low", "medium", "high"]).optional()
});

async function verifyItemOwnership(itemId: string, uid: string): Promise<boolean> {
  const [item] = await query(
    `SELECT ci.id FROM checklist_items ci
     JOIN notes n ON n.id = ci.note_id
     WHERE ci.id = $1 AND n.user_id = $2`,
    [itemId, uid]
  );
  return !!item;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const uid = await verifyAuth(request);
    const { itemId } = await params;

    if (!(await verifyItemOwnership(itemId, uid))) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

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
  } catch (error: any) {
    if (error.message?.includes('Authorization')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const uid = await verifyAuth(request);
    const { itemId } = await params;

    if (!(await verifyItemOwnership(itemId, uid))) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    const [deletedItem] = await query('DELETE FROM checklist_items WHERE id = $1 RETURNING id', [itemId]);
    if (!deletedItem) return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.message?.includes('Authorization')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
