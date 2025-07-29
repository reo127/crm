
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Lead } from '@/lib/models';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
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
    const leads = await Lead.find({ userId: decoded.userId }).sort({ createdAt: -1 });
    return NextResponse.json(leads);
  } catch (error) {
    return NextResponse.json({ message: 'Server error', error }, { status: 500 });
  }
}

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
    const body = await req.json();
    const lead = new Lead({
      ...body,
      userId: decoded.userId,
    });
    await lead.save();
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error', error }, { status: 500 });
  }
}
