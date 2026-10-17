import { db } from "@/lib/db";
import { Logo } from "@/components/shell";
import { fullName } from "@/lib/format";
import { InviteForm } from "./form";

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const invite = await db.invite.findUnique({ where: { code }, include: { student: true, therapist: true } });

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 px-4 py-10">
      <div className="mb-8"><Logo /></div>
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-violet-100/50 sm:p-8">
        {!invite || invite.usedAt ? (
          <>
            <h1 className="text-xl font-semibold">Приглашение недействительно</h1>
            <p className="mt-2 text-sm text-slate-500">Попросите логопеда прислать новую ссылку.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Добро пожаловать!</h1>
            <p className="mt-2 text-sm text-slate-600">
              {invite.therapist.name} приглашает вас в кабинет ученика <b>{fullName(invite.student)}</b>. Здесь будут
              расписание занятий, домашние задания, абонемент и успехи ребёнка.
            </p>
            <InviteForm code={code} phone={invite.phone ?? ""} />
          </>
        )}
      </div>
    </div>
  );
}
