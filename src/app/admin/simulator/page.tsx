"use client";

import { useState, useEffect } from "react";
import { Activity, Radio, DoorOpen, Thermometer, Users } from "lucide-react";

export default function SimulatorPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch(e) {} finally { setLoading(false); }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const sendHeartbeat = async (controllerId: string) => {
    await fetch('/api/device/heartbeat', {
      method: "POST", body: JSON.stringify({ controllerId, timestamp: new Date().toISOString() })
    });
    fetchRooms();
  };

  const syncState = async (controllerId: string, overrides: any) => {
    await fetch('/api/device/state-sync', {
      method: "POST", body: JSON.stringify({ controllerId, states: overrides })
    });
    fetchRooms();
  };

  if (loading) return <div>Loading simulator data...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
         <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-400" /> Demo Simulator
         </h1>
         <p className="text-slate-400 mt-1">Mock hardware states and trigger IoT sync events</p>
      </div>

      <div className="space-y-4">
        {rooms.map(room => (
          <div key={room.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 w-full">
               <div className="flex items-center gap-4 mb-3">
                 <h2 className="text-xl font-bold text-white">RM {room.room_number}</h2>
                 <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${room.state === 'OFFLINE' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                   {room.state}
                 </span>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                 <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                   <p className="text-slate-500 mb-1 flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5" /> Temp</p>
                   <p className="font-mono text-white">{room.current_temperature || '--'}°C</p>
                 </div>
                 <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                   <p className="text-slate-500 mb-1 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Occupied</p>
                   <p className={`font-mono ${room.occupied_now ? 'text-blue-400' : 'text-slate-400'}`}>{room.occupied_now ? 'Yes' : 'No'}</p>
                 </div>
                 <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                   <p className="text-slate-500 mb-1 flex items-center gap-1.5"><DoorOpen className="w-3.5 h-3.5" /> Door</p>
                   <p className={`font-mono ${room.door_open ? 'text-red-400' : 'text-slate-400'}`}>{room.door_open ? 'Open' : 'Closed'}</p>
                 </div>
                 <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                   <p className="text-slate-500 mb-1 flex items-center gap-1.5"><Radio className="w-3.5 h-3.5" /> DND</p>
                   <p className={`font-mono ${room.do_not_disturb ? 'text-amber-400' : 'text-slate-400'}`}>{room.do_not_disturb ? 'On' : 'Off'}</p>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full md:w-auto shrink-0">
               <button 
                 onClick={() => sendHeartbeat(room.controller_id)}
                 className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-colors border border-blue-500/20"
               >
                 Send Heartbeat
               </button>
               <button 
                 onClick={() => syncState(room.controller_id, { doorOpen: !room.door_open })}
                 className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors"
               >
                 Toggle Door
               </button>
               <button 
                 onClick={() => syncState(room.controller_id, { occupiedNow: !room.occupied_now })}
                 className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors"
               >
                 Toggle Occ.
               </button>
               <div className="flex gap-1 col-span-2">
                 <button onClick={() => syncState(room.controller_id, { temperature: Number(room.current_temperature || 22) - 0.5 })} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-medium">-0.5°</button>
                 <button onClick={() => syncState(room.controller_id, { temperature: Number(room.current_temperature || 22) + 0.5 })} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-medium">+0.5°</button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
