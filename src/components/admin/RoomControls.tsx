"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RoomState } from "@prisma/client";
import { Power, ThermometerSun, BellOff, Sparkles, UserCheck, UserMinus, Wrench, RefreshCcw } from "lucide-react";

type RoomControlsProps = {
  roomId: string;
  initialState: RoomState;
  guestControls: boolean;
  dnd: boolean;
  housekeeping: boolean;
};

export function RoomControls({ roomId, initialState, guestControls, dnd, housekeeping }: RoomControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAction = async (endpoint: string, payload: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Action failed: " + (await res.text()));
      }
    } catch (e) {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  const cI = initialState === RoomState.CHECKED_IN;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <Wrench className="w-5 h-5 text-slate-400" />
        Manual Controls <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{loading ? 'Working...' : 'Ready'}</span>
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button disabled={loading} onClick={() => handleAction('check-in', {})} className="p-4 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 text-emerald-400 rounded-xl flex flex-col items-center justify-center gap-2 font-medium transition-colors border border-emerald-500/20">
          <UserCheck className="w-6 h-6" /> Check In
        </button>
        <button disabled={loading} onClick={() => handleAction('check-out', {})} className="p-4 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 text-amber-500 rounded-xl flex flex-col items-center justify-center gap-2 font-medium transition-colors border border-amber-500/20">
          <UserMinus className="w-6 h-6" /> Check Out
        </button>
        <button disabled={loading} onClick={() => handleAction('set-maintenance', {})} className="p-4 bg-purple-500/10 hover:bg-purple-500/20 disabled:opacity-50 text-purple-400 rounded-xl flex flex-col items-center justify-center gap-2 font-medium transition-colors border border-purple-500/20">
          <Wrench className="w-6 h-6" /> Maintenance
        </button>
        <button disabled={loading} onClick={() => handleAction('reset-vacant', {})} className="p-4 bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-50 text-blue-400 rounded-xl flex flex-col items-center justify-center gap-2 font-medium transition-colors border border-blue-500/20">
          <RefreshCcw className="w-6 h-6" /> Reset Vacant
        </button>
      </div>

      <div className="space-y-6 pt-6 border-t border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg"><Power className="w-5 h-5 text-slate-300" /></div>
            <div>
              <p className="font-medium text-slate-200">Main Light</p>
              <p className="text-xs text-slate-500">Sends toggle command</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleAction('lights/main', { on: true })} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors">On</button>
            <button onClick={() => handleAction('lights/main', { on: false })} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors">Off</button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg"><ThermometerSun className="w-5 h-5 text-slate-300" /></div>
            <div>
              <p className="font-medium text-slate-200">HVAC System</p>
              <p className="text-xs text-slate-500">Mode & Setpoint</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <select onChange={(e) => handleAction('hvac/mode', { mode: e.target.value })} className="bg-slate-800 border-none text-sm text-white rounded-lg focus:ring-1 focus:ring-blue-500 px-3 py-2">
               <option value="COMFORT">Comfort</option>
               <option value="ECO">Eco</option>
               <option value="OFF">Off</option>
             </select>
             <div className="flex gap-1">
               <button onClick={() => handleAction('hvac/setpoint', { setpoint: 21 })} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors">21°C</button>
               <button onClick={() => handleAction('hvac/setpoint', { setpoint: 24 })} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors">24°C</button>
             </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><BellOff className="w-5 h-5" /></div>
            <div>
              <p className="font-medium text-slate-200">Do Not Disturb</p>
              <p className="text-xs text-slate-500">Flags room</p>
            </div>
          </div>
          <button 
             onClick={() => handleAction('dnd', { enabled: !dnd })} 
             className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${dnd ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            {dnd ? 'Active' : 'Enable'}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg"><Sparkles className="w-5 h-5" /></div>
            <div>
              <p className="font-medium text-slate-200">Housekeeping</p>
              <p className="text-xs text-slate-500">Request service</p>
            </div>
          </div>
          <button 
             onClick={() => handleAction('housekeeping', { requested: !housekeeping })} 
             className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${housekeeping ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            {housekeeping ? 'Requested' : 'Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
