import { Shell, type NavItem } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { db } from "@/lib/db";

const nav: NavItem[] = [
  { href: "/parent", label: "Главная", icon: "Home" },
  { href: "/parent/schedule", label: "Занятия", icon: "CalendarDays" },
  { href: "/parent/homework", label: "Домашки", icon: "ClipboardList" },
  { href: "/parent/progress", label: "Прогресс", icon: "Sparkles" },
  { href: "/parent/payments", label: "Оплата", icon: "Wallet" },
  { href: "/parent/notifications", label: "Уведомления", icon: "Bell", mobile: false },
  { href: "/parent/settings", label: "Настройки", icon: "Settings", mobile: false },
];

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("PARENT");
  const unread = await db.notification.count({ where: { userId: user.id, readAt: null } });
  return (
    <Shell nav={nav} userName={user.name} roleLabel="Родитель" logout={logout} unread={unread}>
      {children}
    </Shell>
  );
}
