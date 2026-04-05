import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admins and SuperAdmins can see all rooms. Guests shouldn't be here, but let's just return all for admins
    if (session.user.role === 'GUEST') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');

    const rooms = await prisma.room.findMany({
      where: state ? { state: state as any } : undefined,
      orderBy: { room_number: 'asc' },
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
