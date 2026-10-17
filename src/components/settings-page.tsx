import type { User } from "@prisma/client";
import { deleteAccount, logout } from "@/app/actions/auth";
import { updateProfile } from "@/app/actions/therapist";
import { Button, Card, CardTitle, Field, Input, PageHeader, Textarea } from "./ui";
import { SubmitButton } from "./submit-button";
import { PasswordForm } from "./settings";

export function SettingsPage({ user }: { user: User }) {
  return (
    <>
      <PageHeader title="Настройки" subtitle={user.email ?? user.phone ?? undefined} />
      <div className="grid max-w-4xl gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle>Профиль</CardTitle>
          <form action={updateProfile} className="space-y-3">
            <Field label="Имя"><Input name="name" defaultValue={user.name} required /></Field>
            {user.role === "THERAPIST" && (
              <>
                <Field label="О себе" hint="Увидят родители"><Textarea name="about" defaultValue={user.about ?? ""} placeholder="Учитель-логопед, стаж 10 лет…" /></Field>
                <Field label="Реквизиты для оплаты" hint="Родители увидят их на странице абонемента">
                  <Textarea name="paymentDetails" defaultValue={user.paymentDetails ?? ""} placeholder="Перевод по номеру +7… (Т-Банк), получатель Анна И." />
                </Field>
              </>
            )}
            <SubmitButton>Сохранить</SubmitButton>
          </form>
        </Card>
        <div className="space-y-5">
          <Card><CardTitle>Пароль</CardTitle><PasswordForm /></Card>
          <Card>
            <CardTitle>Аккаунт</CardTitle>
            <form action={logout} className="mb-4"><Button variant="secondary">Выйти</Button></form>
            <form action={deleteAccount} className="space-y-2 border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-600">Удаление аккаунта необратимо{user.role === "THERAPIST" ? ": удалятся все ученики, занятия и материалы" : ""}. Введите УДАЛИТЬ для подтверждения.</p>
              <Input name="confirm" placeholder="УДАЛИТЬ" />
              <Button variant="danger">Удалить аккаунт</Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
