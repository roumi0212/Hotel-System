import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReadingType } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { controllerId, roomNumber, states, timestamp } = await request.json();
    if (!controllerId) return NextResponse.json({ error: 'Missing controllerId' }, { status: 400 });

    const room = await prisma.room.findUnique({ where: { controller_id: controllerId } });
    if (!room) return NextResponse.json({ error: 'Controller not registered' }, { status: 404 });

    await prisma.room.update({
      where: { id: room.id },
      data: {
        last_heartbeat_at: new Date(),
        current_temperature: states.temperature,
        occupied_now: states.occupiedNow,
        door_open: states.doorOpen,
        do_not_disturb: states.doNotDisturb,
        housekeeping_requested: states.housekeepingRequested,
      }
    });

    // Optionally create sensor readings for history
    if (states.temperature !== undefined) {
      await prisma.sensorReading.create({
        data: {
          room_id: room.id,
          reading_type: ReadingType.TEMPERATURE,
          value_number: states.temperature
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
