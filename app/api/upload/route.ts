import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';
import crypto from 'crypto';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const uploadSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  base64: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    await verifyAuth(request);
    const body = await request.json();
    const result = uploadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.issues }, { status: 400 });
    }

    const { fileName, contentType, base64 } = result.data;
    const ext = fileName.split('.').pop() || 'jpg';
    const key = `uploads/${crypto.randomUUID()}.${ext}`;

    const buffer = Buffer.from(base64, 'base64');

    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));

    const region = process.env.AWS_REGION!;
    const bucket = process.env.AWS_S3_BUCKET!;
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return NextResponse.json({ publicUrl });
  } catch (error) {
    console.error('ERROR EN UPLOAD:', error);
    const details = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al subir la imagen: ${details}` }, { status: 500 });
  }
}
