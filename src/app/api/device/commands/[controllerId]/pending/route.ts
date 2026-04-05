import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CommandStatus } from '@prisma/client';

export async function GET(request: Request, { params }: { params: Promise<{ controllerId: string }> | { controllerId: string } }) {
  try {
    const { controllerId } = await params;
    const room = await prisma.room.findUnique({ where: { controller_id: controllerId } });
    if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const commands = await prisma.command.findMany({
      where: {
        room_id: room.id,
        status: CommandStatus.PENDING,
      },
      orderBy: { created_at: 'asc' }
    });

    // Mark as SENT
    if (commands.length > 0) {
      await prisma.command.updateMany({
        where: { id: { in: commands.map(c => c.id) } },
        data: { status: CommandStatus.SENT, sent_at: new Date() }
      });
    }

    return NextResponse.json({ commands });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
