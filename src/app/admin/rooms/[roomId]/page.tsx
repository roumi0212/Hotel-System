import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RoomControls } from "@/components/admin/RoomControls";
import { formatDistanceToNow } from "date-fns";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

import { AutoRefresh } from "@/components/AutoRefresh";

export default async function RoomDetailPage({ params }: { params: Promise<{ roomId: string }> | { roomId: string } }) {
  const unwrappedParams = await params;

  const room = await prisma.room.findUnique({
    where: { id: unwrappedParams.roomId },
    include: {
      room_assignments: { where: { is_active: true }, include: { guest_user: true } },
      audit_logs: { take: 8, orderBy: { created_at: 'desc' }, include: { actor_user: true } },
      devices: true
    }
  });

  if (!room) notFound();

  const activeGuest = room.room_assignments[0]?.guest_user;

  return (
    <div className="space-y-6">
      <AutoRefresh interval={2000} />
      <div>
        <Link href="/admin/rooms" className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Rooms
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-white">Room {room.room_number}</h1>
            <StatusBadge state={room.state} className="text-sm px-3 py-1.5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-white mb-4">Live Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                <p className="text-sm text-slate-500 font-medium tracking-wide">Temperature</p>
                <p className="text-2xl font-semibold text-white mt-1">{room.current_temperature ? `${room.current_temperature}°C` : '--'}</p>
              </div>
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                <p className="text-sm text-slate-500 font-medium tracking-wide">Occupancy</p>
                <p className="text-2xl font-semibold text-white mt-1">{room.occupied_now ? 'Present' : 'Empty'}</p>
              </div>
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                <p className="text-sm text-slate-500 font-medium tracking-wide">Door</p>
                <p className={`text-2xl font-semibold mt-1 ${room.door_open ? 'text-red-400' : 'text-white'}`}>{room.door_open ? 'Open' : 'Closed'}</p>
              </div>
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                <p className="text-sm text-slate-500 font-medium tracking-wide">Guest</p>
                <p className="text-lg font-semibold text-white mt-2 truncate">{activeGuest ? activeGuest.full_name : 'None'}</p>
              </div>
            </div>
          </div>

          <RoomControls 
            roomId={room.id} 
            initialState={room.state} 
            guestControls={room.guest_controls_enabled} 
            dnd={room.do_not_disturb}
            housekeeping={room.housekeeping_requested}
          />
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
             <h3 className="text-lg font-semibold text-white mb-4">Device Info</h3>
             <ul className="space-y-3 text-sm">
               <li className="flex justify-between">
                 <span className="text-slate-500">Controller ID</span>
                 <span className="font-mono text-slate-300">{room.controller_id || 'N/A'}</span>
               </li>
               <li className="flex justify-between">
                 <span className="text-slate-500">Adapter Mode</span>
                 <span className="font-mono text-blue-400">{room.adapter_mode}</span>
               </li>
               <li className="flex justify-between">
                 <span className="text-slate-500">Last Heartbeat</span>
                 <span className="text-slate-300">{room.last_heartbeat_at ? formatDistanceToNow(room.last_heartbeat_at, {addSuffix: true}) : 'Never'}</span>
               </li>
             </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {room.audit_logs.map(log => (
                <div key={log.id} className="text-sm">
                  <p className="font-medium text-slate-300">{log.action_type.replace(/_/g, ' ')}</p>
                  <div className="flex justify-between mt-1 text-slate-500 text-xs">
                    <span>{log.actor_user?.full_name || 'System'}</span>
                    <span>{formatDistanceToNow(log.created_at, { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
              {room.audit_logs.length === 0 && <p className="text-sm text-slate-500">No activity yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
