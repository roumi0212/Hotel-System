import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CommandStatus } from '@prisma/client';

export async function GET(request: Request, { params }: { params: Promise<{ controllerId: string }> | { controllerId: string } }) {
  try {
    const { controllerId } = await params;

    // Extract IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : null;

    // Try RoomController first, fall back to Room.controller_id
    const controller = await prisma.roomController.findUnique({
      where: { controller_id: controllerId },
      include: { room: true }
    });

    let roomId: string;

    if (controller) {
      roomId = controller.room_id;

      // Update heartbeat on every poll
      await prisma.roomController.update({
        where: { id: controller.id },
        data: {
          last_heartbeat_at: new Date(),
          ...(ip && { ip_address: ip }),
        }
      });

      // Also update Room.last_heartbeat_at for dashboard queries
      await prisma.room.update({
        where: { id: roomId },
        data: { last_heartbeat_at: new Date() }
      });
    } else {
      const room = await prisma.room.findUnique({ where: { controller_id: controllerId } });
      if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      roomId = room.id;

      await prisma.room.update({
        where: { id: roomId },
        data: { last_heartbeat_at: new Date() }
      });
    }

    const commands = await prisma.command.findMany({
      where: {
        room_id: roomId,
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

    // Format for ESP32 constraints
    const formattedCommands = commands.map(c => {
      let cmdType = c.command_type as string;
      let payload = c.payload_json as any;
      
      // Translate LIGHT_SET -> LIGHTS_MAIN
      if (cmdType === 'LIGHT_SET' && payload?.target === 'mainLight') {
        cmdType = 'LIGHTS_MAIN';
        payload = { on: payload.on };
      }

      // ROOM_STATE_SET passes through as-is: { dnd: bool, housekeeping: bool }

      return {
        id: c.id,
        command_type: cmdType,
        payload: payload,
      };
    });

    return NextResponse.json({ commands: formattedCommands });
  } catch (error) {
    console.error('[PENDING_COMMANDS_ERROR]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
