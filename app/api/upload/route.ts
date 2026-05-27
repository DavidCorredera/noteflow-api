import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { verifyAuth } from '@/lib/auth';
import crypto from 'crypto';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    await verifyAuth(request);
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof (file as any).arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 400 });
    }

    const fileObj = file as File;
    const ext = fileObj.name?.split('.').pop() || 'jpg';
    const contentType = fileObj.type || 'image/jpeg';
    const key = `uploads/${crypto.randomUUID()}.${ext}`;

    const buffer = Buffer.from(await fileObj.arrayBuffer());

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
