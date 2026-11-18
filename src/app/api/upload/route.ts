import { NextResponse } from 'next/server';
import { getCurrentUserFromCookies } from '@/lib/auth';
import { saveFileAttachment } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUserFromCookies();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to upload files' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const attachment = await saveFileAttachment({
      buffer,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
    });

    return NextResponse.json({
      success: true,
      attachment,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'File upload failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
