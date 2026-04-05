import { prisma } from "@/lib/prisma";
import { RoomState } from "@prisma/client";
import { Building2, Key, Users, AlertCircle, Sparkles, BellOff } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default async function AdminDashboard() {
  const [rooms, logs] = await Promise.all([
    prisma.room.findMany(),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: { room: true, actor_user: true }
    })
  ]);

  const total = rooms.length;
  const checkedIn = rooms.filter(r => r.state === RoomState.CHECKED_IN).length;
  const vacant = rooms.filter(r => r.state === RoomState.VACANT).length;
  const offline = rooms.filter(r => r.state === RoomState.OFFLINE).length;
  const dnd = rooms.filter(r => r.do_not_disturb).length;
  const housekeeping = rooms.filter(r => r.housekeeping_requested).length;

  const stats = [
    { label: "Total Rooms", value: total, icon: Building2, color: "text-slate-400", bg: "bg-slate-500/10" },
    { label: "Checked In", value: checkedIn, icon: Key, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Vacant", value: vacant, icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Offline/Issues", value: offline, icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "DND Active", value: dnd, icon: BellOff, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Cleaning Req.", value: housekeeping, icon: Sparkles, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Operations Dashboard</h1>
        <p className="text-slate-400 mt-1">Real-time overview of hotel status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center shadow-lg hover:border-slate-700 transition-colors">
              <div className={`p-4 rounded-xl ${stat.bg} mr-5`}>
                <Icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                <p className="text-3xl font-semibold text-white mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-4">
           {/* Placeholder for future charts if needed */}
           <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/10 border border-slate-800 rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 text-blue-400">
               <Building2 className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-medium text-white mb-2">Welcome to System MVP</h3>
             <p className="text-slate-400 max-w-sm">Use the sidebar to manage rooms, view logs, or launch the device simulator.</p>
             <Link href="/admin/rooms" className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
                View All Rooms
             </Link>
           </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <div className="flex-1 space-y-4">
            {logs.map(log => (
              <div key={log.id} className="flex gap-3 text-sm">
                <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-slate-300">
                    <span className="font-medium text-white">{log.actor_user?.full_name || 'System'}</span> 
                    {' '}{log.action_type.toLowerCase().replace(/_/g, ' ')}
                    {log.room && <span className="text-blue-400"> Rm {log.room.room_number}</span>}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{formatDistanceToNow(log.created_at, { addSuffix: true })}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/admin/audit" className="text-sm text-blue-400 hover:text-blue-300 font-medium mt-4 pt-4 border-t border-slate-800 text-center">
            View full log &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
