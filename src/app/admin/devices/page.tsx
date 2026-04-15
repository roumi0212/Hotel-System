import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Wifi, WifiOff, Cpu, ChevronRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function isOnline(heartbeat: Date | null, stateSync: Date | null): boolean {
  const latest = [heartbeat, stateSync].filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0];
  if (!latest) return false;
  return (Date.now() - latest.getTime()) < 60_000; // 60 second threshold
}

export default async function DevicesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "GUEST") {
    return <div className="p-12 text-center text-white"><p className="text-red-400 text-lg">Access Denied — Staff only area.</p></div>;
  }

  const controllers = await prisma.roomController.findMany({
    include: { room: true },
    orderBy: { created_at: 'asc' }
  });

  // Also get rooms without controllers (MOCK rooms)
  const unassignedRooms = await prisma.room.findMany({
    where: { room_controller: null },
    orderBy: { room_number: 'asc' }
  });

  const onlineCount = controllers.filter(c => isOnline(c.last_heartbeat_at, c.last_state_sync_at)).length;

  return (
    <div className="space-y-6">
      <AutoRefresh interval={5000} />

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Device Registry</h1>
        <p className="text-slate-500 text-sm mt-1">ESP32 room controllers and hardware status</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Total Controllers</p>
          <p className="text-3xl font-semibold text-white">{controllers.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Online</p>
          <p className="text-3xl font-semibold text-green-400">{onlineCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Offline</p>
          <p className="text-3xl font-semibold text-red-400">{controllers.length - onlineCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Unassigned Rooms</p>
          <p className="text-3xl font-semibold text-slate-400">{unassignedRooms.length}</p>
        </div>
      </div>

      {/* Controller table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            Registered Controllers
          </h2>
        </div>

        {controllers.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            No controllers registered. Run the seed script to provision devices.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-widest text-slate-500 border-b border-slate-800">
                  <th className="text-left px-6 py-3">Room</th>
                  <th className="text-left px-6 py-3">Controller ID</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">IP Address</th>
                  <th className="text-left px-6 py-3">Last Heartbeat</th>
                  <th className="text-left px-6 py-3">Last Sync</th>
                  <th className="text-left px-6 py-3">Mode</th>
                  <th className="text-left px-6 py-3">Firmware</th>
                  <th className="text-left px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {controllers.map(ctrl => {
                  const online = isOnline(ctrl.last_heartbeat_at, ctrl.last_state_sync_at);
                  return (
                    <tr key={ctrl.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">Room {ctrl.room.room_number}</p>
                          {ctrl.friendly_name && <p className="text-xs text-slate-500 mt-0.5">{ctrl.friendly_name}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">{ctrl.controller_id}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                          online ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                          {online ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400 text-xs">{ctrl.ip_address || '—'}</td>
                      <td className="px-6 py-4 text-slate-400">
                        {ctrl.last_heartbeat_at
                          ? formatDistanceToNow(ctrl.last_heartbeat_at, { addSuffix: true })
                          : <span className="text-slate-600">Never</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {ctrl.last_state_sync_at
                          ? formatDistanceToNow(ctrl.last_state_sync_at, { addSuffix: true })
                          : <span className="text-slate-600">Never</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          ctrl.adapter_mode === 'REAL' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {ctrl.adapter_mode}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{ctrl.firmware_version || '—'}</td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/rooms/${ctrl.room_id}/diagnostics`} className="text-blue-400 hover:text-blue-300 transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unassigned rooms */}
      {unassignedRooms.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Rooms Without Controllers</h2>
          <p className="text-sm text-slate-500 mb-4">These rooms do not have a physical ESP32 registered. They operate in MOCK mode.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {unassignedRooms.map(room => (
              <Link key={room.id} href={`/admin/rooms/${room.id}`}
                className="px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors text-center">
                <p className="text-sm font-medium text-white">Room {room.room_number}</p>
                <p className="text-xs text-slate-600 mt-1">{room.adapter_mode}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Provisioning instructions */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">How to Add a New Room Controller</h3>
        <ol className="text-sm text-slate-500 space-y-2 list-decimal list-inside">
          <li>Ensure the target room exists in the database (e.g. Room 102)</li>
          <li>Open <code className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">seed_controller.mjs</code> and uncomment / add a new <code className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">provisionController()</code> call</li>
          <li>Set <code className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">roomNumber: &quot;102&quot;</code> and <code className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">controllerId: &quot;ESP_102&quot;</code></li>
          <li>Run <code className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">node seed_controller.mjs</code></li>
          <li>Flash the ESP32 firmware with <code className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">CONTROLLER_ID = &quot;ESP_102&quot;</code></li>
          <li>Power on the ESP32 — it will appear here automatically</li>
        </ol>
      </div>
    </div>
  );
}
