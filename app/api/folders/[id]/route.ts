import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const updateFolderSchema = z.object({
  name: z.string().trim().min(1).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

function unauthorized() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const uid = await verifyAuth(request);
    const { id } = await params;

    const [existing] = await query('SELECT id FROM folders WHERE id = $1 AND user_id = $2', [id, uid]);
    if (!existing) return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 });

    const body = await request.json();
    const result = updateFolderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.issues }, { status: 400 });
    }

    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (result.data.name !== undefined) { sets.push(`name = $${idx++}`); values.push(result.data.name); }
    if (result.data.color !== undefined) { sets.push(`color = $${idx++}`); values.push(result.data.color); }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    sets.push('updated_at = NOW()');
    values.push(id);

    const [folder] = await query(
      `UPDATE folders SET ${sets.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING id, name, color, type, created_at, updated_at`,
      [...values, uid]
    );

    return NextResponse.json(folder);
  } catch (error: any) {
    if (error.message?.includes('Authorization')) return unauthorized();
    console.error('ERROR EN PATCH /folders/[id]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const uid = await verifyAuth(request);
    const { id } = await params;

    const [existing] = await query('SELECT id FROM folders WHERE id = $1 AND user_id = $2', [id, uid]);
    if (!existing) return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 });

    await query('UPDATE notes SET folder_id = NULL WHERE folder_id = $1 AND user_id = $2', [id, uid]);
    await query('DELETE FROM folders WHERE id = $1 AND user_id = $2', [id, uid]);

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.message?.includes('Authorization')) return unauthorized();
    console.error('ERROR EN DELETE /folders/[id]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
