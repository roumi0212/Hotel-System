"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, Settings, ScrollText, Users, LogOut, Activity, Cpu } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const links = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/rooms", label: "Rooms", icon: Building2 },
    { href: "/admin/devices", label: "Devices", icon: Cpu },
    { href: "/admin/audit", label: "Audit Logs", icon: ScrollText },
  ];

  if (session?.user?.role === "SUPER_ADMIN") {
    links.push({ href: "/admin/users", label: "Users", icon: Users });
  }

  return (
    <div className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col pt-8 pb-6 px-4">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-white tracking-tight text-lg">Hotel Admin</span>
      </div>

      <nav className="flex-1 space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? "bg-blue-500/10 text-blue-400 font-medium" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 mt-6 border-t border-slate-800/50 space-y-4">
        <div className="px-2">
          <p className="text-sm font-medium text-slate-200 truncate">{session?.user?.name || "Admin"}</p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{session?.user?.email}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
