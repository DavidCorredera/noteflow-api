import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const createFolderSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color'),
  type: z.enum(['note', 'checklist', 'idea']),
});

export async function GET(request: Request) {
  try {
    const uid = await verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type || !['note', 'checklist', 'idea'].includes(type)) {
      return NextResponse.json({ error: 'Invalid or missing type parameter' }, { status: 400 });
    }

    const folders = await query(
      'SELECT id, name, color, type, created_at, updated_at FROM folders WHERE user_id = $1 AND type = $2 ORDER BY created_at ASC',
      [uid, type]
    );

    return NextResponse.json({ folders });
  } catch (error: any) {
    if (error.message?.includes('Authorization')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('ERROR EN GET /folders:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const uid = await verifyAuth(request);
    const body = await request.json();
    const result = createFolderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.issues }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const [folder] = await query(
      'INSERT INTO folders (id, name, color, type, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, color, type, created_at, updated_at',
      [id, result.data.name, result.data.color, result.data.type, uid]
    );

    return NextResponse.json(folder, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes('Authorization')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('ERROR AL CREAR CARPETA:', error);
    return NextResponse.json({ error: 'Error al crear la carpeta' }, { status: 500 });
  }
}
