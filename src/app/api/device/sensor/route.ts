import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReadingType } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { controllerId, readings, timestamp } = await request.json();
    if (!controllerId || !readings) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const room = await prisma.room.findUnique({ where: { controller_id: controllerId } });
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    for (const r of readings) {
      await prisma.sensorReading.create({
        data: {
          room_id: room.id,
          reading_type: r.type as ReadingType,
          value_number: r.valueNumber,
          value_boolean: r.valueBoolean,
          value_string: r.valueString,
          created_at: timestamp ? new Date(timestamp) : new Date()
        }
      });
      
      // Update room state if necessary
      if (r.type === 'TEMPERATURE') {
        await prisma.room.update({ where: { id: room.id }, data: { current_temperature: r.valueNumber }});
      }
      if (r.type === 'OCCUPANCY') {
        await prisma.room.update({ where: { id: room.id }, data: { occupied_now: r.valueBoolean }});
      }
      if (r.type === 'DOOR') {
        await prisma.room.update({ where: { id: room.id }, data: { door_open: r.valueBoolean }});
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
