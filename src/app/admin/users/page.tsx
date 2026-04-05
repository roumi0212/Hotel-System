import { prisma } from "@/lib/prisma";
import { Users as UsersIcon, ShieldAlert } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500/50 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-slate-400">Only SUPER_ADMIN users can view this page.</p>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { created_at: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-blue-400" /> Platform Users
          </h1>
          <p className="text-slate-400 mt-1">Manage administrators and staff access</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Name</th>
                <th className="px-6 py-4 font-medium tracking-wider">Email</th>
                <th className="px-6 py-4 font-medium tracking-wider">Role</th>
                <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-200">
                    {u.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {u.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${u.role === 'SUPER_ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : u.role === 'ADMIN' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {u.is_active ? (
                       <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active</span>
                    ) : (
                       <span className="flex items-center gap-1.5 text-red-400 text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Disabled</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs">
                    {formatDistanceToNow(u.created_at, { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
