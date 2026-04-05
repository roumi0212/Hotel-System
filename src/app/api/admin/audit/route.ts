import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const logs = await prisma.auditLog.findMany({
      where: roomId ? { room_id: roomId } : undefined,
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        actor_user: { select: { full_name: true, email: true } },
        room: { select: { room_number: true } }
      }
    });

    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
