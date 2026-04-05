import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RoomState } from '@prisma/client';

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> | { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = await params;
    const body = await request.json().catch(() => ({}));
    const guestName = body.guestName || 'Guest';

    // 1. Find room
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    // 2. Update room state
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        state: RoomState.CHECKED_IN,
        guest_controls_enabled: true,
        housekeeping_requested: false,
        do_not_disturb: false,
      }
    });

    // 3. Create Audit Log
    await prisma.auditLog.create({
      data: {
        action_type: 'CHECK_IN',
        success: true,
        actor_user_id: session.user.id,
        actor_role: session.user.role as any,
        room_id: roomId,
        action_details: { guestName }
      }
    });

    return NextResponse.json({
      roomId: updatedRoom.id,
      state: updatedRoom.state,
      guestControlsEnabled: updatedRoom.guest_controls_enabled,
      hvacMode: "COMFORT", // Mock default
      housekeepingRequested: updatedRoom.housekeeping_requested
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
