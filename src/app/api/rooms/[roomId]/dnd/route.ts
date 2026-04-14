import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RoomState, CommandType, CommandSource } from '@prisma/client';

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> | { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { roomId } = await params;
    const { enabled } = await request.json();

    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { room_assignments: true } });
    if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (session.user.role === 'GUEST') {
      if (!room.guest_controls_enabled || room.state !== RoomState.CHECKED_IN) {
        return NextResponse.json({ error: 'Guest controls disabled' }, { status: 403 });
      }
      const activeAssignment = room.room_assignments.find(a => a.is_active && a.guest_user_id === session.user.id);
      if (!activeAssignment) return NextResponse.json({ error: 'Not your room' }, { status: 403 });
    }

    // Update live room flag
    await prisma.room.update({
      where: { id: roomId },
      data: { do_not_disturb: enabled }
    });

    // Dispatch ROOM_STATE_SET so ESP32 drives DND LED + HK LED accurately
    await prisma.command.create({
      data: {
        room_id: roomId,
        command_type: CommandType.ROOM_STATE_SET,
        payload_json: { dnd: enabled, housekeeping: room.housekeeping_requested },
        requested_by_user_id: session.user.id,
        source: session.user.role === 'GUEST' ? CommandSource.GUEST_UI : CommandSource.ADMIN_UI,
      }
    });

    await prisma.auditLog.create({
      data: {
        action_type: 'DND_TOGGLE',
        success: true,
        actor_user_id: session.user.id,
        actor_role: session.user.role as any,
        room_id: roomId,
        action_details: { enabled }
      }
    });

    return NextResponse.json({ success: true, doNotDisturb: enabled });
  } catch (error) {
    console.error('[DND_ROUTE_ERROR]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
