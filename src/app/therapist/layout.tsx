import { Shell, type NavItem } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { db } from "@/lib/db";

const nav: NavItem[] = [
  { href: "/therapist", label: "Главная", icon: "Home" },
  { href: "/therapist/schedule", label: "Расписание", icon: "CalendarDays" },
  { href: "/therapist/students", label: "Ученики", icon: "Users" },
  { href: "/therapist/homework", label: "Домашки", icon: "ClipboardList" },
  { href: "/therapist/finance", label: "Финансы", icon: "Wallet" },
  { href: "/therapist/materials", label: "Материалы", icon: "BookOpen", mobile: false },
  { href: "/therapist/analytics", label: "Аналитика", icon: "BarChart3", mobile: false },
  { href: "/therapist/notifications", label: "Уведомления", icon: "Bell", mobile: false },
  { href: "/therapist/settings", label: "Настройки", icon: "Settings", mobile: false },
];

export default async function TherapistLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("THERAPIST");
  const unread = await db.notification.count({ where: { userId: user.id, readAt: null } });
  return (
    <Shell nav={nav} userName={user.name} roleLabel="Логопед" logout={logout} unread={unread}>
      {children}
    </Shell>
  );
}
