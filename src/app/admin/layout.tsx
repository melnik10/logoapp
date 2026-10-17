import { Shell, type NavItem } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

const nav: NavItem[] = [
  { href: "/admin", label: "Сводка", icon: "BarChart3" },
  { href: "/admin/users", label: "Пользователи", icon: "Users" },
  { href: "/admin/materials", label: "Материалы", icon: "BookOpen" },
  { href: "/admin/settings", label: "Настройки", icon: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("ADMIN");
  return <Shell nav={nav} userName={user.name} roleLabel="Администратор" logout={logout}>{children}</Shell>;
}
