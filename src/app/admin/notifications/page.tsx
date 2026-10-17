import { requireUser } from "@/lib/auth";
import { NotificationsPage } from "@/components/notifications-page";

export default async function Page() {
  const user = await requireUser("ADMIN");
  return <NotificationsPage userId={user.id} />;
}
