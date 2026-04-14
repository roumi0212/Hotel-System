import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RequestStatus, GuestRequestType, CommandType, CommandSource } from '@prisma/client';

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string; requestId: string }> | { roomId: string; requestId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Staff/admin only — guests cannot resolve requests
    if (session.user.role === 'GUEST') {
      return NextResponse.json({ error: 'Forbidden: staff access only' }, { status: 403 });
    }

    const { roomId, requestId } = await params;

    const guestRequest = await prisma.guestRequest.findUnique({
      where: { id: requestId },
    });

    if (!guestRequest || guestRequest.room_id !== roomId) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (guestRequest.status === RequestStatus.RESOLVED) {
      return NextResponse.json({ error: 'Already resolved' }, { status: 409 });
    }

    // Resolve the workflow record
    await prisma.guestRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.RESOLVED,
        resolved_at: new Date(),
        resolved_by_user_id: session.user.id,
      }
    });

    // Only clear room.housekeeping_requested if this was a HOUSEKEEPING-type request
    let updatedRoom = await prisma.room.findUnique({ where: { id: roomId } });
    if (guestRequest.request_type === GuestRequestType.HOUSEKEEPING && updatedRoom) {
      await prisma.room.update({
        where: { id: roomId },
        data: { housekeeping_requested: false }
      });

      // Emit ROOM_STATE_SET so ESP32 turns off HK LED
      await prisma.command.create({
        data: {
          room_id: roomId,
          command_type: CommandType.ROOM_STATE_SET,
          payload_json: { dnd: updatedRoom.do_not_disturb, housekeeping: false },
          requested_by_user_id: session.user.id,
          source: CommandSource.ADMIN_UI,
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        action_type: 'REQUEST_RESOLVED',
        success: true,
        actor_user_id: session.user.id,
        actor_role: session.user.role as any,
        room_id: roomId,
        action_details: { requestId, requestType: guestRequest.request_type }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[RESOLVE_REQUEST_ERROR]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
