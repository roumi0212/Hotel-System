import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RoomState, CommandType, CommandSource, GuestRequestType, HousekeepingTimeSlot } from '@prisma/client';

const VALID_SLOTS: HousekeepingTimeSlot[] = ['NOW', 'MORNING', 'AFTERNOON', 'EVENING', 'CUSTOM'];

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> | { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { roomId } = await params;
    const { requested, preferred_time_slot, notes } = await request.json();

    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { room_assignments: true } });
    if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (session.user.role === 'GUEST') {
      if (!room.guest_controls_enabled || room.state !== RoomState.CHECKED_IN) {
        return NextResponse.json({ error: 'Guest controls disabled' }, { status: 403 });
      }
      const activeAssignment = room.room_assignments.find(a => a.is_active && a.guest_user_id === session.user.id);
      if (!activeAssignment) return NextResponse.json({ error: 'Not your room' }, { status: 403 });
    }

    // Validate time slot if requesting housekeeping
    let slot: HousekeepingTimeSlot | null = null;
    if (requested && preferred_time_slot) {
      if (!VALID_SLOTS.includes(preferred_time_slot)) {
        return NextResponse.json({ error: 'Invalid time slot. Must be one of: NOW, MORNING, AFTERNOON, EVENING, CUSTOM' }, { status: 400 });
      }
      slot = preferred_time_slot as HousekeepingTimeSlot;
    }

    // Update live room flag
    await prisma.room.update({
      where: { id: roomId },
      data: { housekeeping_requested: requested }
    });

    // Create workflow record if requesting (not cancelling)
    if (requested) {
      await prisma.guestRequest.create({
        data: {
          room_id: roomId,
          request_type: GuestRequestType.HOUSEKEEPING,
          preferred_time_slot: slot,
          notes: slot === 'CUSTOM' ? (notes || null) : null,
          created_by_user_id: session.user.id,
        }
      });
    }

    // Dispatch ROOM_STATE_SET so ESP32 drives both LEDs correctly
    await prisma.command.create({
      data: {
        room_id: roomId,
        command_type: CommandType.ROOM_STATE_SET,
        payload_json: { dnd: room.do_not_disturb, housekeeping: requested },
        requested_by_user_id: session.user.id,
        source: session.user.role === 'GUEST' ? CommandSource.GUEST_UI : CommandSource.ADMIN_UI,
      }
    });

    await prisma.auditLog.create({
      data: {
        action_type: 'HOUSEKEEPING_REQUEST',
        success: true,
        actor_user_id: session.user.id,
        actor_role: session.user.role as any,
        room_id: roomId,
        action_details: { requested, preferred_time_slot: slot }
      }
    });

    return NextResponse.json({ success: true, housekeepingRequested: requested });
  } catch (error) {
    console.error('[HOUSEKEEPING_ROUTE_ERROR]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
