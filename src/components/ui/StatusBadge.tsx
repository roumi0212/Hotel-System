import { RoomState } from "@prisma/client";
import { cn } from "@/lib/utils";

export function StatusBadge({ state, className }: { state: RoomState, className?: string }) {
  const colorMap = {
    [RoomState.VACANT]: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    [RoomState.CHECKED_IN]: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    [RoomState.CHECKED_OUT]: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    [RoomState.MAINTENANCE]: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    [RoomState.OFFLINE]: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const labels = {
    [RoomState.VACANT]: "Vacant",
    [RoomState.CHECKED_IN]: "Checked In",
    [RoomState.CHECKED_OUT]: "Checked Out",
    [RoomState.MAINTENANCE]: "Maintenance",
    [RoomState.OFFLINE]: "Offline",
  };

  return (
    <span className={cn("px-2.5 py-1 text-xs font-medium rounded-md border", colorMap[state], className)}>
      {labels[state]}
    </span>
  );
}
