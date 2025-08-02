
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Lead } from '@/lib/models';
import { verifyToken } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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
    const body = await req.json();
    const lead = await Lead.findOneAndUpdate(
      { _id: params.id, userId: decoded.userId },
      body,
      { new: true }
    );

    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error: unknown) {
    return NextResponse.json({ message: 'Server error', error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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
    const lead = await Lead.findOneAndDelete({ _id: params.id, userId: decoded.userId });

    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error: unknown) {
    return NextResponse.json({ message: 'Server error', error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
  }
}
