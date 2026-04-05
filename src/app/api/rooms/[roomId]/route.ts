import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ roomId: string }> | { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = await params;
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        devices: true,
        sensor_readings: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        audit_logs: {
          orderBy: { created_at: 'desc' },
          take: 5,
        },
        commands: {
          orderBy: { created_at: 'desc' },
          take: 5,
        }
      }
    });

    if (!room) {
      // maybe it's the room number?
      const roomByNum = await prisma.room.findUnique({
        where: { room_number: roomId },
        include: { devices: true }
      });
      if (roomByNum) return NextResponse.json({ room: roomByNum });
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
