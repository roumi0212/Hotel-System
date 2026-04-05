import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { GuestControls } from "@/components/guest/GuestControls";
import { RoomState } from "@prisma/client";
import { AutoRefresh } from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";

export default async function GuestDashboardPage({ params }: { params: Promise<{ roomNumber: string }> | { roomNumber: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect("/login");

  // Handle Next.js 15 async params
  const unwrappedParams = await params;

  const room = await prisma.room.findUnique({
    where: { room_number: unwrappedParams.roomNumber },
    include: {
      room_assignments: { where: { is_active: true }, include: { guest_user: true } }
    }
  });

  if (!room) notFound();

  // If user is GUEST, verify assignment
  if (session.user.role === "GUEST") {
    const activeAssignment = room.room_assignments.find(a => a.guest_user_id === session.user.id);
    if (!activeAssignment) {
      return <div className="p-12 text-center text-white">Unauthorized: Not your assigned room.</div>;
    }
  }

  const isEnabled = room.state === RoomState.CHECKED_IN && room.guest_controls_enabled;
  const guestName = room.room_assignments[0]?.guest_user?.full_name || "Guest";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      <AutoRefresh interval={2000} />
      {/* Premium ambient background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

      <GuestControls 
        roomId={room.id}
        roomNumber={room.room_number}
        isEnabled={isEnabled}
        dnd={room.do_not_disturb}
        housekeeping={room.housekeeping_requested}
        guestName={guestName}
      />
    </div>
  );
}
