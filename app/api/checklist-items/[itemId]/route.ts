import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: { itemId: string } }) {
  try {
    const body = await request.json();
    const { is_completed, text } = body;

    const [updatedItem] = await query(
      `UPDATE checklist_items
       SET is_completed = COALESCE($1, is_completed),
           text = COALESCE($2, text)
       WHERE id = $3 RETURNING *`,
      [is_completed, text, params.itemId]
    );

    if (!updatedItem) return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    return NextResponse.json(updatedItem);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { itemId: string } }) {
  try {
    const [deletedItem] = await query('DELETE FROM checklist_items WHERE id = $1 RETURNING id', [params.itemId]);
    if (!deletedItem) return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}