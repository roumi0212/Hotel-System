import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RoomState } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { controllerId, timestamp } = await request.json();
    if (!controllerId) return NextResponse.json({ error: 'Missing controllerId' }, { status: 400 });

    const room = await prisma.room.findUnique({ where: { controller_id: controllerId } });
    if (!room) return NextResponse.json({ error: 'Controller not registered' }, { status: 404 });

    await prisma.room.update({
      where: { id: room.id },
      data: {
        last_heartbeat_at: timestamp ? new Date(timestamp) : new Date(),
        state: room.state === RoomState.OFFLINE ? RoomState.VACANT : undefined // Recovery rule D
      }
    });

    if (room.state === RoomState.OFFLINE) {
      await prisma.auditLog.create({
         data: { action_type: 'DEVICE_RECOVERY', room_id: room.id, success: true }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
