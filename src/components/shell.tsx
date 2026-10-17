"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  BarChart3, BookOpen, CalendarDays, ClipboardList, Home, LogOut, Settings, Users, Wallet, Shield, Sparkles, Bell,
} from "lucide-react";
import type { ReactNode } from "react";

const icons = { BarChart3, BookOpen, CalendarDays, ClipboardList, Home, Settings, Users, Wallet, Shield, Sparkles, Bell };
export type NavItem = { href: string; label: string; icon: keyof typeof icons; mobile?: boolean };

export function Shell({
  nav, userName, roleLabel, logout, unread = 0, children,
}: {
  nav: NavItem[]; userName: string; roleLabel: string; logout: () => Promise<void>; unread?: number; children: ReactNode;
}) {
  const path = usePathname();
  const isActive = (href: string) => (href.split("/").length <= 2 ? path === href : path.startsWith(href));
  const mobile = nav.filter((n) => n.mobile !== false).slice(0, 5);
  const home = nav[0].href;

  return (
    <div className="min-h-dvh bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white px-3 py-5 lg:flex">
        <Link href={home} className="mb-6 flex items-center gap-2 px-3">
          <Logo />
        </Link>
        <nav className="flex-1 space-y-1">
          {nav.map((n) => {
            const Icon = icons[n.icon];
            return (
              <Link
                key={n.href}
                href={n.href}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  isActive(n.href) ? "bg-violet-50 text-violet-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon size={18} /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 px-3 pt-4">
          <p className="truncate text-sm font-medium text-slate-900">{userName}</p>
          <p className="text-xs text-slate-500">{roleLabel}</p>
          <form action={logout}>
            <button className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
              <LogOut size={16} /> Выйти
            </button>
          </form>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <Link href={home}><Logo /></Link>
        <div className="flex items-center gap-1">
          <Link href={`${home}/notifications`} className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Уведомления">
            <Bell size={20} />
            {unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />}
          </Link>
          <Link href={`${home}/settings`} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Настройки">
            <Settings size={20} />
          </Link>
        </div>
      </header>

      <main className="px-4 pb-28 pt-5 sm:px-6 lg:ml-64 lg:px-10 lg:pb-12 lg:pt-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${mobile.length}, 1fr)` }}>
          {mobile.map((n) => {
            const Icon = icons[n.icon];
            return (
              <Link key={n.href} href={n.href} className={clsx("flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium", isActive(n.href) ? "text-violet-700" : "text-slate-500")}>
                <Icon size={22} />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
        <Sparkles size={18} />
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-900">LogoApp</span>
    </span>
  );
}
