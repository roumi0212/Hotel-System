import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ScrollText, Search } from "lucide-react";

export default async function AuditPage({ searchParams }: { searchParams: { roomId?: string } }) {
  const queryRoomId = searchParams.roomId;

  const logs = await prisma.auditLog.findMany({
    where: queryRoomId ? { room_id: queryRoomId } : undefined,
    orderBy: { created_at: 'desc' },
    take: 100,
    include: {
      actor_user: { select: { full_name: true, email: true } },
      room: { select: { room_number: true } }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <ScrollText className="w-8 h-8 text-blue-400" /> System Audit Logs
          </h1>
          <p className="text-slate-400 mt-1">Review the latest 100 actions and events</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Timestamp</th>
                <th className="px-6 py-4 font-medium tracking-wider">Actor</th>
                <th className="px-6 py-4 font-medium tracking-wider">Action</th>
                <th className="px-6 py-4 font-medium tracking-wider">Room</th>
                <th className="px-6 py-4 font-medium tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {format(log.created_at, "MMM dd, HH:mm:ss")}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-200">{log.actor_user?.full_name || 'System'}</p>
                    <p className="text-xs text-slate-500">{log.actor_role || ''}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 bg-slate-800 rounded-md text-xs font-medium text-blue-300 border border-slate-700">
                      {log.action_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.room?.room_number ? (
                      <span className="font-mono text-emerald-400">{log.room.room_number}</span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400 max-w-xs truncate" title={JSON.stringify(log.action_details)}>
                    {log.action_details ? JSON.stringify(log.action_details) : '-'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
