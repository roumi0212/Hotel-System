import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatDistanceToNow, format } from "date-fns";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ChevronLeft, Wifi, WifiOff, Thermometer, DoorOpen, User, BellOff, Sparkles, Lightbulb, Cpu, Globe, HardDrive } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function isOnline(heartbeat: Date | null, stateSync: Date | null): boolean {
  const latest = [heartbeat, stateSync].filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0];
  if (!latest) return false;
  return (Date.now() - latest.getTime()) < 60_000;
}

export default async function DiagnosticsPage({ params }: { params: Promise<{ roomId: string }> | { roomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

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
      room_controller: true,
      commands: {
        where: { status: { in: ['PENDING', 'SENT'] } },
        orderBy: { created_at: 'desc' },
        take: 10,
      }
    }
  });

  if (!room) notFound();

  const ctrl = room.room_controller;
  const online = ctrl
    ? isOnline(ctrl.last_heartbeat_at, ctrl.last_state_sync_at)
    : isOnline(room.last_heartbeat_at, room.last_state_sync_at);

  const isReal = ctrl ? ctrl.adapter_mode === 'REAL' : room.adapter_mode === 'REAL';

  return (
    <div className="space-y-6">
      <AutoRefresh interval={3000} />

      <div>
        <Link href={`/admin/rooms/${roomId}`} className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Room
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Room {room.room_number} — Diagnostics</h1>
          <span className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${online ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {online ? 'Online' : 'Offline'}
          </span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isReal ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
            {isReal ? 'REAL' : 'MOCK'}
          </span>
        </div>
        <p className="text-slate-500 text-sm mt-1">Live hardware status — staff view only</p>
      </div>

      {/* Controller Identity Card */}
      {ctrl && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4" /> Controller Identity
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500">Controller ID</p>
              <p className="font-mono text-white mt-1">{ctrl.controller_id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Friendly Name</p>
              <p className="text-slate-300 mt-1">{ctrl.friendly_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Firmware</p>
              <p className="font-mono text-slate-300 mt-1">{ctrl.firmware_version || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">IP Address</p>
              <p className="font-mono text-slate-300 mt-1">{ctrl.ip_address || '—'}</p>
            </div>
          </div>
          {ctrl.notes && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500">Notes</p>
              <p className="text-sm text-slate-400 mt-1">{ctrl.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Timestamps */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4" /> Connectivity
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500">Last Heartbeat</p>
            {(ctrl?.last_heartbeat_at || room.last_heartbeat_at) ? (
              <>
                <p className="text-white text-sm mt-1">{formatDistanceToNow((ctrl?.last_heartbeat_at || room.last_heartbeat_at)!, { addSuffix: true })}</p>
                <p className="text-xs text-slate-600 mt-0.5">{format((ctrl?.last_heartbeat_at || room.last_heartbeat_at)!, 'dd MMM yyyy HH:mm:ss')}</p>
              </>
            ) : (
              <p className="text-red-400 text-sm mt-1">Never received</p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500">Last State Sync</p>
            {(ctrl?.last_state_sync_at || room.last_state_sync_at) ? (
              <>
                <p className="text-white text-sm mt-1">{formatDistanceToNow((ctrl?.last_state_sync_at || room.last_state_sync_at)!, { addSuffix: true })}</p>
                <p className="text-xs text-slate-600 mt-0.5">{format((ctrl?.last_state_sync_at || room.last_state_sync_at)!, 'dd MMM yyyy HH:mm:ss')}</p>
              </>
            ) : (
              <p className="text-red-400 text-sm mt-1">Never received</p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500">Adapter Mode</p>
            <p className={`text-sm font-medium mt-1 ${isReal ? 'text-blue-400' : 'text-slate-400'}`}>{isReal ? 'REAL (ESP32)' : 'MOCK (Simulated)'}</p>
          </div>
        </div>
      </div>

      {/* Live Sensor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5" /> Room Temperature
          </p>
          <p className="text-2xl font-light text-white">
            {room.current_temperature != null ? `${Number(room.current_temperature).toFixed(1)}°C` : '--'}
          </p>
          <p className="text-xs text-slate-600 mt-1">AC Target: <span className="text-cyan-400">{room.ac_set_temperature ? `${room.ac_set_temperature}°C` : '22°C'}</span></p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Occupancy (PIR)
          </p>
          <p className={`text-lg font-medium ${room.occupied_now ? 'text-green-400' : 'text-slate-400'}`}>
            {room.occupied_now ? 'Motion Detected' : 'No Motion'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <DoorOpen className="w-3.5 h-3.5" /> Door Sensor
          </p>
          <p className={`text-lg font-medium ${room.door_open ? 'text-red-400' : 'text-white'}`}>
            {room.door_open ? 'Open' : 'Closed'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <BellOff className="w-3.5 h-3.5" /> DND State
          </p>
          <p className={`text-lg font-medium ${room.do_not_disturb ? 'text-amber-400' : 'text-slate-400'}`}>
            {room.do_not_disturb ? 'Active' : 'Inactive'}
          </p>
          <p className="text-xs text-slate-600 mt-1">Controls DND LED (GPIO 32)</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Housekeeping State
          </p>
          <p className={`text-lg font-medium ${room.housekeeping_requested ? 'text-cyan-400' : 'text-slate-400'}`}>
            {room.housekeeping_requested ? 'Requested' : 'Not Requested'}
          </p>
          <p className="text-xs text-slate-600 mt-1">Controls HK LED (GPIO 33)</p>
        </div>

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

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5" /> Room State
          </p>
          <p className="text-lg font-medium text-white">{room.state}</p>
          <p className="text-xs text-slate-600 mt-1">Guest controls: <span className={room.guest_controls_enabled ? 'text-green-400' : 'text-slate-500'}>{room.guest_controls_enabled ? 'Enabled' : 'Disabled'}</span></p>
        </div>
      </div>
    </div>
  );
}
