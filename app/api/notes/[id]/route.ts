import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const [note] = await query('SELECT * FROM notes WHERE id = $1', [params.id]);
    if (!note) return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { title, content, color } = body;
    
    const [updatedNote] = await query(
      `UPDATE notes 
       SET title = COALESCE($1, title), 
           content = COALESCE($2, content), 
           color = COALESCE($3, color),
           updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [title, content, color, params.id]
    );

    if (!updatedNote) return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });
    return NextResponse.json(updatedNote);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const [deletedNote] = await query('DELETE FROM notes WHERE id = $1 RETURNING id', [params.id]);
    if (!deletedNote) return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}