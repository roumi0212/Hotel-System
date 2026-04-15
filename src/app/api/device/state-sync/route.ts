import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReadingType } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { controllerId, states } = await request.json();
    if (!controllerId) return NextResponse.json({ error: 'Missing controllerId' }, { status: 400 });

    // Extract IP from request headers (works behind proxy/Railway)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : null;

    // Find the RoomController first, fall back to Room.controller_id for backward compat
    const controller = await prisma.roomController.findUnique({
      where: { controller_id: controllerId },
      include: { room: true }
    });

    let roomId: string;

    if (controller) {
      roomId = controller.room_id;

      // Update RoomController metadata
      await prisma.roomController.update({
        where: { id: controller.id },
        data: {
          last_state_sync_at: new Date(),
          last_heartbeat_at: new Date(),
          ...(ip && { ip_address: ip }),
        }
      });
    } else {
      // Fallback: look up by Room.controller_id (backward compat)
      const room = await prisma.room.findUnique({ where: { controller_id: controllerId } });
      if (!room) return NextResponse.json({ error: 'Controller not registered' }, { status: 404 });
      roomId = room.id;
    }

    // Update Room live-state fields (used by dashboards)
    await prisma.room.update({
      where: { id: roomId },
      data: {
        last_heartbeat_at: new Date(),
        last_state_sync_at: new Date(),
        current_temperature: states.temperature,
        occupied_now: states.occupiedNow,
        door_open: states.doorOpen,
        do_not_disturb: states.doNotDisturb,
        housekeeping_requested: states.housekeepingRequested,
      }
    });

    // Create sensor reading for temperature history
    if (states.temperature !== undefined) {
      await prisma.sensorReading.create({
        data: {
          room_id: roomId,
          reading_type: ReadingType.TEMPERATURE,
          value_number: states.temperature
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[STATE_SYNC_ERROR]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
