"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { BellOff, Sparkles, LifeBuoy, CheckCircle2 } from "lucide-react";

type GuestRequest = {
  id: string;
  request_type: string;
  category: string | null;
  notes: string | null;
  preferred_time_slot: string | null;
  created_at: string;
  created_by_user: { full_name: string } | null;
};

type Props = {
  roomId: string;
  requests: GuestRequest[];
};

const typeIcon = (type: string) => {
  if (type === 'HOUSEKEEPING') return <Sparkles className="w-4 h-4 text-cyan-400" />;
  if (type === 'DND_ON' || type === 'DND_OFF') return <BellOff className="w-4 h-4 text-amber-400" />;
  return <LifeBuoy className="w-4 h-4 text-blue-400" />;
};

export function GuestRequestsPanel({ roomId, requests }: Props) {
  const router = useRouter();
  const [resolving, setResolving] = useState<string | null>(null);

  const handleResolve = async (requestId: string) => {
    setResolving(requestId);
    try {
      await fetch(`/api/rooms/${roomId}/requests/${requestId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setResolving(null);
    }
  };

  if (requests.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        Open Requests
        <span className="bg-red-500/20 text-red-400 text-xs font-medium px-2 py-0.5 rounded-full">{requests.length}</span>
      </h3>
      <div className="space-y-3">
        {requests.map(req => (
          <div key={req.id} className="flex items-start justify-between gap-4 p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5">{typeIcon(req.request_type)}</div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">
                  {req.request_type.replace(/_/g, ' ')}
                  {req.category && <span className="ml-2 text-slate-400 text-xs">· {req.category}</span>}
                  {req.preferred_time_slot && <span className="ml-2 text-cyan-500/70 text-xs">· {req.preferred_time_slot}</span>}
                </p>
                {req.notes && <p className="text-xs text-slate-500 mt-0.5 truncate">{req.notes}</p>}
                <p className="text-xs text-slate-600 mt-1">
                  {req.created_by_user?.full_name || 'Guest'} · {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleResolve(req.id)}
              disabled={resolving === req.id}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {resolving === req.id ? 'Resolving...' : 'Resolve'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
