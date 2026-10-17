import type { HomeworkStatus } from "@prisma/client";
import { homeworkStatusLabel } from "@/lib/labels";
import { Badge } from "./ui";

export function HwBadge({ status }: { status: HomeworkStatus }) {
  const tone = { ASSIGNED: "bg-sky-100 text-sky-700", SUBMITTED: "bg-amber-100 text-amber-700", REVIEWED: "bg-emerald-100 text-emerald-700" }[status];
  return <Badge className={tone}>{homeworkStatusLabel[status]}</Badge>;
}
