"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RoomState } from "@prisma/client";
import { Power, ThermometerSun, BellOff, Sparkles, Fan, User } from "lucide-react";

type GuestControlsProps = {
  roomId: string;
  roomNumber: string;
  isEnabled: boolean;
  dnd: boolean;
  housekeeping: boolean;
  guestName: string;
  hvacMode?: string;
  hvacSetpoint?: number;
};

export function GuestControls({ roomId, roomNumber, isEnabled, dnd, housekeeping, guestName, hvacMode, hvacSetpoint }: GuestControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAction = async (endpoint: string, payload: any) => {
    if (!isEnabled) return;
    setLoading(true);
    try {
      await fetch(`/api/rooms/${roomId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isEnabled) {
    return (
      <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center text-slate-300">
        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-800">
           <Power className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-3xl font-light text-white mb-3">Room Controls Unavailable</h2>
        <p className="max-w-md text-slate-400">Controls are tied to your reservation. If you recently checked out, access is disabled. Please contact the front desk for assistance.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto p-6 lg:p-12">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl lg:text-5xl font-light text-white tracking-tight">Room {roomNumber}</h1>
          <p className="text-xl text-blue-400 mt-2 flex items-center gap-2">
            <User className="w-5 h-5" /> Welcome, {guestName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-extralight text-white tracking-tighter">22<span className="text-3xl text-slate-500">°C</span></p>
          <p className="text-sm text-slate-400 mt-2 uppercase tracking-widest font-medium">Indoor Temp</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        
        {/* Lights */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <Power className="w-32 h-32 text-blue-400" />
          </div>
          <h2 className="text-2xl font-light text-white mb-8">Lighting</h2>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <button onClick={() => handleAction('lights/main', { on: true })} className="py-6 bg-slate-800/80 hover:bg-slate-700 rounded-2xl text-white font-medium transition-colors active:scale-95 shadow-lg border border-slate-700/50">
              Master On
            </button>
            <button onClick={() => handleAction('lights/main', { on: false })} className="py-6 bg-slate-950/80 hover:bg-slate-900 rounded-2xl text-slate-400 font-medium transition-colors active:scale-95 shadow-inner border border-slate-800">
              Master Off
            </button>
          </div>
        </div>

        {/* Climate */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute bottom-0 right-0 p-6 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
            <Fan className="w-32 h-32 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-light text-white mb-8">Climate</h2>
          <div className="flex gap-4 mb-6 relative z-10">
            {['COMFORT', 'ECO', 'OFF'].map(mode => (
              <button key={mode} onClick={() => handleAction('hvac/mode', { mode })} className="flex-1 py-4 bg-slate-800/80 hover:bg-slate-700 rounded-2xl text-white text-sm font-medium transition-colors active:scale-95 border border-slate-700/50 text-center">
                {mode}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between relative z-10 bg-slate-950/50 rounded-2xl p-2 border border-slate-800">
            <button onClick={() => handleAction('hvac/setpoint', { setpoint: (hvacSetpoint||22) - 1 })} className="w-16 h-16 rounded-xl bg-slate-800 text-white text-2xl hover:bg-slate-700 active:scale-95 transition-all">-</button>
            <div className="text-center">
              <span className="text-3xl font-light text-white">{hvacSetpoint || 22}°C</span>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Target</p>
            </div>
            <button onClick={() => handleAction('hvac/setpoint', { setpoint: (hvacSetpoint||22) + 1 })} className="w-16 h-16 rounded-xl bg-slate-800 text-white text-2xl hover:bg-slate-700 active:scale-95 transition-all">+</button>
          </div>
        </div>

        {/* Services */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mt-2">
          <button 
             onClick={() => handleAction('dnd', { enabled: !dnd })} 
             className={`p-8 rounded-3xl border flex items-center justify-between transition-all duration-300 active:scale-[0.98] ${
               dnd ? 'bg-amber-500/20 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80'
             }`}
          >
            <div className="text-left">
              <h3 className={`text-2xl font-light ${dnd ? 'text-amber-400' : 'text-white'}`}>Do Not Disturb</h3>
              <p className={`mt-2 ${dnd ? 'text-amber-500/70' : 'text-slate-500'}`}>{dnd ? 'Privacy active' : 'Tap to enable'}</p>
            </div>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${dnd ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-800 text-slate-400'}`}>
              <BellOff className="w-8 h-8" />
            </div>
          </button>

          <button 
             onClick={() => handleAction('housekeeping', { requested: !housekeeping })} 
             className={`p-8 rounded-3xl border flex items-center justify-between transition-all duration-300 active:scale-[0.98] ${
               housekeeping ? 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)]' : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80'
             }`}
          >
            <div className="text-left">
              <h3 className={`text-2xl font-light ${housekeeping ? 'text-cyan-400' : 'text-white'}`}>Housekeeping</h3>
              <p className={`mt-2 ${housekeeping ? 'text-cyan-500/70' : 'text-slate-500'}`}>{housekeeping ? 'Service requested' : 'Request room makeup'}</p>
            </div>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${housekeeping ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-slate-800 text-slate-400'}`}>
              <Sparkles className="w-8 h-8" />
            </div>
          </button>
        </div>

      </div>
    </div>
  );
}
