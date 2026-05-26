import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

export async function query<T = unknown>(text: string, params: unknown[] = []): Promise<T[]> {
  return sql.query(text, params) as Promise<T[]>;
}
