import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Lead } from '@/lib/models';
import { verifyToken } from '@/lib/auth';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ message: 'Access denied. No token provided.' }, { status: 401 });
  }

  const decoded = verifyToken(token) as { userId: string };
  if (!decoded) {
    return NextResponse.json({ message: 'Invalid token.' }, { status: 400 });
  }

  await dbConnect();

  try {
    const formData = await req.formData();
    const file = formData.get('csvFile') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const results: Record<string, string>[] = [];

    await new Promise<void>((resolve, reject) => {
      Readable.from(buffer)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve())
        .on('error', (error) => reject(error));
    });

    const leadsToInsert = results.map(lead => ({
      ...lead,
      userId: decoded.userId,
    }));

    await Lead.insertMany(leadsToInsert);

    return NextResponse.json({ message: 'CSV data imported successfully.' });

  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Server error during file upload.', error: errorMessage }, { status: 500 });
  }
}
