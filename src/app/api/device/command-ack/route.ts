import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CommandStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { controllerId, commandId, status, timestamp } = await request.json();
    if (!controllerId || !commandId || !status) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const room = await prisma.room.findUnique({ where: { controller_id: controllerId } });
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    await prisma.command.update({
      where: { id: commandId },
      data: {
        status: status as CommandStatus,
        acknowledged_at: timestamp ? new Date(timestamp) : new Date(),
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[COMMAND_ACK_ERROR]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
