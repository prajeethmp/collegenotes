import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { NoteAttachment } from './types';

export interface UploadOptions {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export async function saveFileAttachment(options: UploadOptions): Promise<NoteAttachment> {
  const { buffer, filename, mimeType } = options;
  const ext = path.extname(filename).toLowerCase().replace('.', '') || 'bin';
  const size = buffer.length;
  const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  // 1. Check if Vercel Blob is configured (via BLOB_READ_WRITE_TOKEN)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`notes/${id}-${cleanFilename}`, buffer, {
        access: 'public',
        contentType: mimeType,
      });
      return {
        id,
        name: filename,
        size,
        mimeType,
        extension: ext,
        url: blob.url,
        storageType: 'blob',
      };
    } catch (blobErr) {
      console.warn('Vercel Blob upload failed, falling back:', blobErr);
    }
  }

  // 2. Check if Cloudinary is configured
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      const timestamp = Math.floor(Date.now() / 1000);

      // Create signature for Cloudinary REST API upload
      const crypto = await import('crypto');
      const signature = crypto
        .createHash('sha1')
        .update(`folder=notes&timestamp=${timestamp}${apiSecret}`)
        .digest('hex');

      const formData = new FormData();
      const base64File = `data:${mimeType};base64,${buffer.toString('base64')}`;
      formData.append('file', base64File);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', 'notes');

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        return {
          id,
          name: filename,
          size,
          mimeType,
          extension: ext,
          url: data.secure_url || data.url,
          storageType: 'cloudinary',
        };
      }
    } catch (cloudErr) {
      console.warn('Cloudinary upload failed, falling back:', cloudErr);
    }
  }

  // 3. Fallback: For local node environment, save to public/uploads
  if (process.env.NODE_ENV !== 'production') {
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const uniqueFilename = `${id}_${cleanFilename}`;
      const filePath = path.join(uploadsDir, uniqueFilename);
      fs.writeFileSync(filePath, buffer);

      return {
        id,
        name: filename,
        size,
        mimeType,
        extension: ext,
        url: `/uploads/${uniqueFilename}`,
        storageType: 'local',
      };
    } catch (fsErr) {
      console.warn('Local fs save failed, using base64 inline:', fsErr);
    }
  }

  // 4. Zero-dependency fallback: Inline Base64 Data URI
  // Allows notes to be stored and accessed instantly without ANY cloud configuration!
  const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;
  return {
    id,
    name: filename,
    size,
    mimeType,
    extension: ext,
    url: base64Data,
    storageType: 'inline',
  };
}
