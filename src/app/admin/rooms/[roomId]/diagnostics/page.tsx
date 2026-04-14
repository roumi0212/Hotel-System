import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatDistanceToNow, format } from "date-fns";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ChevronLeft, Wifi, WifiOff, Thermometer, DoorOpen, User, BellOff, Sparkles, Lightbulb } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DiagnosticsPage({ params }: { params: Promise<{ roomId: string }> | { roomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Staff/admin only
  if (session.user.role === "GUEST") {
    return (
      <div className="p-12 text-center text-white">
        <p className="text-red-400 text-lg">Access Denied — Staff only area.</p>
      </div>
    );
  }

  const { roomId } = await params;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      commands: {
        where: { status: { in: ['PENDING', 'SENT'] } },
        orderBy: { created_at: 'desc' },
        take: 10,
      }
    }
  });

  if (!room) notFound();

  const isOnline = room.last_heartbeat_at && (Date.now() - new Date(room.last_heartbeat_at).getTime()) < 60_000;

  return (
    <div className="space-y-6">
      <AutoRefresh interval={3000} />

      <div>
        <Link href={`/admin/rooms/${roomId}`} className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Room
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Room {room.room_number} — Diagnostics</h1>
          <span className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <p className="text-slate-500 text-sm mt-1">Live hardware status — staff view only</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* Controller */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Controller</p>
          <p className="text-slate-300 font-mono text-sm">{room.controller_id || 'Not assigned'}</p>
          <p className="text-xs text-slate-600 mt-2">Mode: <span className="text-blue-400">{room.adapter_mode}</span></p>
        </div>

        {/* Last Heartbeat */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Last Heartbeat</p>
          {room.last_heartbeat_at ? (
            <>
              <p className="text-white text-sm">{formatDistanceToNow(room.last_heartbeat_at, { addSuffix: true })}</p>
              <p className="text-xs text-slate-600 mt-1">{format(room.last_heartbeat_at, 'dd MMM yyyy HH:mm:ss')}</p>
            </>
          ) : (
            <p className="text-red-400 text-sm">Never received</p>
          )}
        </div>

        {/* Room Temperature */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5" /> Room Temperature
          </p>
          <p className="text-2xl font-light text-white">
            {room.current_temperature != null ? `${Number(room.current_temperature).toFixed(1)}°C` : '--'}
          </p>
          <p className="text-xs text-slate-500 mt-1">From ESP32 sensor</p>
          <p className="text-xs text-slate-600 mt-1">AC Target: <span className="text-cyan-400">{room.ac_set_temperature ? `${room.ac_set_temperature}°C` : '22°C'}</span></p>
        </div>

        {/* Occupancy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Occupancy (PIR)
          </p>
          <p className={`text-lg font-medium ${room.occupied_now ? 'text-green-400' : 'text-slate-400'}`}>
            {room.occupied_now ? 'Motion Detected' : 'No Motion'}
          </p>
          <p className="text-xs text-slate-600 mt-1">Digital PIR state</p>
        </div>

        {/* Door */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <DoorOpen className="w-3.5 h-3.5" /> Door Sensor
          </p>
          <p className={`text-lg font-medium ${room.door_open ? 'text-red-400' : 'text-white'}`}>
            {room.door_open ? 'Open' : 'Closed'}
          </p>
          <p className="text-xs text-slate-600 mt-1">Magnetic contact state</p>
        </div>

        {/* DND Flag */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <BellOff className="w-3.5 h-3.5" /> DND State
          </p>
          <p className={`text-lg font-medium ${room.do_not_disturb ? 'text-amber-400' : 'text-slate-400'}`}>
            {room.do_not_disturb ? 'Active' : 'Inactive'}
          </p>
          <p className="text-xs text-slate-600 mt-1">Controls DND LED on ESP32</p>
        </div>

        {/* Housekeeping Flag */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Housekeeping
          </p>
          <p className={`text-lg font-medium ${room.housekeeping_requested ? 'text-cyan-400' : 'text-slate-400'}`}>
            {room.housekeeping_requested ? 'Requested' : 'Not Requested'}
          </p>
          <p className="text-xs text-slate-600 mt-1">Controls HK LED on ESP32</p>
        </div>

        {/* Relay/Light status - inferred from command queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" /> Pending Commands
          </p>
          <p className="text-lg font-medium text-white">{room.commands.length}</p>
          {room.commands.length > 0 && (
            <ul className="mt-2 space-y-1">
              {room.commands.slice(0, 3).map(cmd => (
                <li key={cmd.id} className="text-xs text-slate-500 font-mono">{cmd.command_type} · {cmd.status}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Room State */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Room State</p>
          <p className="text-lg font-medium text-white">{room.state}</p>
          <p className="text-xs text-slate-600 mt-1">Guest controls: <span className={room.guest_controls_enabled ? 'text-green-400' : 'text-slate-500'}>{room.guest_controls_enabled ? 'Enabled' : 'Disabled'}</span></p>
        </div>

      </div>
    </div>
  );
}
