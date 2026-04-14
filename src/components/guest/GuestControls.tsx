"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RoomState } from "@prisma/client";
import { Power, BellOff, Sparkles, Fan, User, LifeBuoy, ThermometerSun } from "lucide-react";

const HK_SLOTS = ['NOW', 'MORNING', 'AFTERNOON', 'EVENING', 'CUSTOM'] as const;
const HELP_CATEGORIES = ['Towels', 'Toiletries', 'Pillows', 'Room Issue', 'General'] as const;

type HKSlot = typeof HK_SLOTS[number];

type GuestControlsProps = {
  roomId: string;
  roomNumber: string;
  isEnabled: boolean;
  dnd: boolean;
  housekeeping: boolean;
  guestName: string;
  currentTemperature?: number | null;
  acSetTemperature?: number | null;
};

export function GuestControls({ roomId, roomNumber, isEnabled, dnd, housekeeping, guestName, currentTemperature, acSetTemperature }: GuestControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Housekeeping modal state
  const [showHKModal, setShowHKModal] = useState(false);
  const [hkSlot, setHkSlot] = useState<HKSlot>('NOW');
  const [hkNotes, setHkNotes] = useState('');

  // Help modal state
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpCategory, setHelpCategory] = useState<string>('General');
  const [helpNotes, setHelpNotes] = useState('');
  const [helpSent, setHelpSent] = useState(false);

  const acTemp = Number(acSetTemperature ?? 22);

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

  const handleHKSubmit = async () => {
    await handleAction('housekeeping', {
      requested: true,
      preferred_time_slot: hkSlot,
      notes: hkSlot === 'CUSTOM' ? hkNotes : undefined,
    });
    setShowHKModal(false);
    setHkSlot('NOW');
    setHkNotes('');
  };

  const handleHelpSubmit = async () => {
    await handleAction('help', { category: helpCategory, notes: helpNotes || undefined });
    setHelpSent(true);
    setTimeout(() => { setHelpSent(false); setShowHelpModal(false); setHelpNotes(''); }, 2000);
  };

  if (!isEnabled) {
    return (
      <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center text-slate-300">
        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-800">
           <Power className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-3xl font-light text-white mb-3">Room Controls Unavailable</h2>
        <p className="max-w-md text-slate-400">Controls are tied to your reservation. Please contact the front desk for assistance.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto p-6 lg:p-12">
      {/* Header */}
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl lg:text-5xl font-light text-white tracking-tight">Room {roomNumber}</h1>
          <p className="text-xl text-blue-400 mt-2 flex items-center gap-2">
            <User className="w-5 h-5" /> Welcome, {guestName}
          </p>
        </div>
        {/* Temperature display — split into live sensor vs AC target */}
        <div className="text-right space-y-2">
          <div>
            <p className="text-4xl font-extralight text-white tracking-tighter">
              {currentTemperature != null ? Number(currentTemperature).toFixed(1) : '--'}
              <span className="text-2xl text-slate-500">°C</span>
            </p>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium flex items-center justify-end gap-1">
              <ThermometerSun className="w-3 h-3" /> Room Temperature
            </p>
          </div>
          <div>
            <p className="text-xl font-light text-cyan-400 tracking-tighter">
              {acTemp}
              <span className="text-base text-cyan-600">°C target</span>
            </p>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">AC Set Temperature</p>
          </div>
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

        {/* AC Climate Control */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute bottom-0 right-0 p-6 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
            <Fan className="w-32 h-32 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-light text-white mb-4">Air Conditioning</h2>
          <p className="text-sm text-slate-500 mb-6">Set your target temperature</p>
          <div className="flex items-center justify-between relative z-10 bg-slate-950/50 rounded-2xl p-2 border border-slate-800">
            <button
              onClick={() => handleAction('hvac/setpoint', { setpoint: Math.max(18, acTemp - 1) })}
              disabled={acTemp <= 18}
              className="w-16 h-16 rounded-xl bg-slate-800 text-white text-2xl hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-30"
            >-</button>
            <div className="text-center">
              <span className="text-4xl font-light text-cyan-400">{acTemp}°C</span>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Target</p>
              <p className="text-xs text-slate-600 mt-1">Range: 18–30°C</p>
            </div>
            <button
              onClick={() => handleAction('hvac/setpoint', { setpoint: Math.min(30, acTemp + 1) })}
              disabled={acTemp >= 30}
              className="w-16 h-16 rounded-xl bg-slate-800 text-white text-2xl hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-30"
            >+</button>
          </div>
        </div>

        {/* Service Buttons */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-2">

          {/* DND */}
          <button
            onClick={() => handleAction('dnd', { enabled: !dnd })}
            className={`p-8 rounded-3xl border flex items-center justify-between transition-all duration-300 active:scale-[0.98] ${
              dnd ? 'bg-amber-500/20 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80'
            }`}
          >
            <div className="text-left">
              <h3 className={`text-xl font-light ${dnd ? 'text-amber-400' : 'text-white'}`}>Do Not Disturb</h3>
              <p className={`mt-2 text-sm ${dnd ? 'text-amber-500/70' : 'text-slate-500'}`}>{dnd ? 'Privacy active — tap to disable' : 'Tap to enable'}</p>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dnd ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-800 text-slate-400'}`}>
              <BellOff className="w-7 h-7" />
            </div>
          </button>

          {/* Housekeeping */}
          <button
            onClick={() => housekeeping ? handleAction('housekeeping', { requested: false }) : setShowHKModal(true)}
            className={`p-8 rounded-3xl border flex items-center justify-between transition-all duration-300 active:scale-[0.98] ${
              housekeeping ? 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)]' : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80'
            }`}
          >
            <div className="text-left">
              <h3 className={`text-xl font-light ${housekeeping ? 'text-cyan-400' : 'text-white'}`}>Housekeeping</h3>
              <p className={`mt-2 text-sm ${housekeeping ? 'text-cyan-500/70' : 'text-slate-500'}`}>{housekeeping ? 'Service requested — tap to cancel' : 'Request room service'}</p>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${housekeeping ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-slate-800 text-slate-400'}`}>
              <Sparkles className="w-7 h-7" />
            </div>
          </button>

          {/* Help */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-8 rounded-3xl border bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 flex items-center justify-between transition-all duration-300 active:scale-[0.98]"
          >
            <div className="text-left">
              <h3 className="text-xl font-light text-white">Need Help?</h3>
              <p className="mt-2 text-sm text-slate-500">Contact hotel staff</p>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-800 text-slate-400">
              <LifeBuoy className="w-7 h-7" />
            </div>
          </button>
        </div>
      </div>

      {/* Housekeeping Modal */}
      {showHKModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-light text-white mb-2">Request Housekeeping</h2>
            <p className="text-slate-400 text-sm mb-6">When would you like your room serviced?</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {HK_SLOTS.map(slot => (
                <button
                  key={slot}
                  onClick={() => setHkSlot(slot)}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${hkSlot === slot ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  {slot.charAt(0) + slot.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            {hkSlot === 'CUSTOM' && (
              <textarea
                value={hkNotes}
                onChange={e => setHkNotes(e.target.value)}
                placeholder="Describe your preferred time or any special requests..."
                className="w-full bg-slate-800 text-white rounded-xl p-3 text-sm border border-slate-700 resize-none h-20 mb-4 focus:outline-none focus:border-cyan-500"
              />
            )}
            <div className="flex gap-3 mt-2">
              <button onClick={() => setShowHKModal(false)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={handleHKSubmit} className="flex-1 py-3 rounded-xl bg-cyan-500 text-white font-medium hover:bg-cyan-400 transition-colors">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-light text-white mb-2">How can we help?</h2>
            <p className="text-slate-400 text-sm mb-6">Select a category and add any details</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {HELP_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setHelpCategory(cat)}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${helpCategory === cat ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <textarea
              value={helpNotes}
              onChange={e => setHelpNotes(e.target.value)}
              placeholder="Optional details..."
              className="w-full bg-slate-800 text-white rounded-xl p-3 text-sm border border-slate-700 resize-none h-20 mb-4 focus:outline-none focus:border-blue-500"
            />
            {helpSent && <p className="text-green-400 text-sm mb-3 text-center">✓ Request sent — staff notified</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowHelpModal(false)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={handleHelpSubmit} className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-400 transition-colors">Send Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
