import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function query<T = unknown>(text: string, params: unknown[] = []): Promise<T[]> {
  const response = await (sql as any).query(text, params);

  return response.rows ? response.rows : response as T[];
}