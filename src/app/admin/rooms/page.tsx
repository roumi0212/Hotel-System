import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import { Thermometer, BellOff, Sparkles, User, DoorOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const rooms = await prisma.room.findMany({
    orderBy: { room_number: 'asc' },
    include: {
      room_assignments: {
        where: { is_active: true },
        include: { guest_user: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Rooms Status</h1>
          <p className="text-slate-400 mt-1">Manage guestrooms and devices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {rooms.map(room => (
          <Link href={`/admin/rooms/${room.id}`} key={room.id} className="group">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-200">
              <div className="p-5 flex justify-between items-start border-b border-slate-800/50">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white mb-1">{room.room_number}</h2>
                    {room.housekeeping_requested && <Sparkles className="w-5 h-5 text-cyan-400" />}
                    {room.do_not_disturb && <BellOff className="w-5 h-5 text-amber-400" />}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge state={room.state} />
                    {room.state === 'OFFLINE' && room.last_heartbeat_at && (
                      <span className="text-xs text-red-400/80">seen {formatDistanceToNow(room.last_heartbeat_at, { addSuffix: true })}</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <Thermometer className="w-4 h-4 text-slate-500" />
                    {room.current_temperature ? `${room.current_temperature}°C` : '--'}
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 bg-slate-900/50 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <User className="w-4 h-4" />
                  {room.room_assignments[0]?.guest_user?.full_name || 'No Guest'}
                </div>
                <div className="flex gap-3 justify-end text-slate-500">
                  {room.occupied_now ? <span className="text-blue-400 flex items-center gap-1">Occupied</span> : <span>Empty</span>}
                  <span>&bull;</span>
                  {room.door_open ? <span className="text-red-400 flex flex-center gap-1"><DoorOpen className="w-3 h-3"/> Open</span> : <span className="flex items-center gap-1"><DoorOpen className="w-3 h-3"/> Closed</span>}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
