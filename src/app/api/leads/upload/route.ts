
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Lead } from '@/lib/models';
import { verifyToken } from '@/lib/auth';
import csv from 'csv-parser';
import { Readable } from 'stream';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ message: 'Access denied. No token provided.' }, { status: 401 });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ message: 'Invalid token.' }, { status: 400 });
  }

  await dbConnect();

  try {
    const formData = await req.formData();
    const file = formData.get('csvFile') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    interface LeadData {
      name: string;
      email: string;
      phoneNumber: string;
      status: string;
      userId: string;
    }
    const leads: LeadData[] = [];
    const fileBuffer = await file.arrayBuffer();
    const readableStream = new Readable();
    readableStream.push(Buffer.from(fileBuffer));
    readableStream.push(null);

    await new Promise((resolve, reject) => {
      readableStream
        .pipe(csv())
        .on('data', (data) => {
          if (data.name && data.email && data.phoneNumber) {
            leads.push({
              name: data.name,
              email: data.email,
              phoneNumber: data.phoneNumber,
              status: data.status || 'New',
              userId: decoded.userId,
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    const savedLeads = await Lead.insertMany(leads);

    return NextResponse.json({ 
      message: `Successfully uploaded ${savedLeads.length} leads`,
      leads: savedLeads 
    });
  } catch (error) {
    return NextResponse.json({ message: 'Server error', error }, { status: 500 });
  }
}
