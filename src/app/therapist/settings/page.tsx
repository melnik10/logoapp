import { requireUser } from "@/lib/auth";
import { SettingsPage } from "@/components/settings-page";

export default async function Page() {
  return <SettingsPage user={await requireUser("THERAPIST")} />;
}
