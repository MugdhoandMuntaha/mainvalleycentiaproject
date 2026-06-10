import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save under the main storefront's public/uploads directory (which is in the parent folder)
    const uploadDir = path.join(process.cwd(), '..', 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Clean and make filename unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const filename = `${uniqueSuffix}-${safeName}`;
    const filePath = path.join(uploadDir, filename);

    await fs.promises.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;
    return NextResponse.json({ url: fileUrl });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
