import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME!,
  api_key: process.env.CLOUD_API_KEY!,
  api_secret: process.env.CLOUD_SECRET_KEY!,
  secure: true,
});

export async function POST(req: Request) {
  try {
    const { data, folder } = await req.json();

    if (!data || !data.startsWith('data:')) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
    }

    const result = await cloudinary.uploader.upload(data, {
      folder: folder ?? 'boutique_flow',
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good', fetch_format: 'auto' },
        { width: 1200, crop: 'limit' },
      ],
    });

    return NextResponse.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err: any) {
    console.error('[upload] error:', err);
    return NextResponse.json({ error: err.message ?? 'Upload failed' }, { status: 500 });
  }
}
