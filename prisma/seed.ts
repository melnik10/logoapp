import { PrismaClient, type LessonStatus, type SoundStage } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, addWeeks, setHours, setMinutes, startOfDay, startOfWeek, subWeeks } from "date-fns";

const db = new PrismaClient();

async function main() {
  await db.user.deleteMany();
  const passwordHash = await bcrypt.hash("demo123", 10);

  await db.user.create({ data: { name: "Администратор", email: "admin@demo.ru", passwordHash, role: "ADMIN" } });
  const t = await db.user.create({
    data: {
      name: "Анна Мельникова", email: "logoped@demo.ru", phone: "+79990000000", passwordHash, role: "THERAPIST",
      about: "Учитель-логопед, стаж 8 лет. Постановка звуков, ФФНР, ОНР.",
      paymentDetails: "Перевод по номеру +7 999 000-00-00 (Т-Банк, Сбер), получатель Анна М.\nВ комментарии укажите имя ребёнка.",
    },
  });
  const mom = await db.user.create({ data: { name: "Мария Петрова", phone: "+79990000001", passwordHash, role: "PARENT" } });
  const dad = await db.user.create({ data: { name: "Игорь Смирнов", phone: "+79990000002", passwordHash, role: "PARENT" } });

  const kids = [
    { firstName: "Миша", lastName: "Петров", birth: "2019-03-12", color: "#7c3aed", parent: mom.id, conclusion: "Дислалия, сложная форма. Нарушено произношение свистящих и сонорных.", program: "До конца года: ввести в речь Р и Л, автоматизировать С в словах.", sounds: { С: "WORDS", З: "SYLLABLES", Р: "STAGING", Л: "PHRASES", Ш: "SPEECH" } as Record<string, SoundStage> },
    { firstName: "Соня", lastName: "Петрова", birth: "2017-08-02", color: "#db2777", parent: mom.id, conclusion: "ФФНР.", program: "Дифференциация С–Ш, подготовка к школе.", sounds: { С: "DIFFERENTIATION", Ш: "DIFFERENTIATION", Р: "SPEECH" } as Record<string, SoundStage> },
    { firstName: "Артём", lastName: "Смирнов", birth: "2018-11-20", color: "#0891b2", parent: dad.id, conclusion: "ОНР III уровня.", program: "Словарь, грамматический строй, звук Р.", sounds: { Р: "SYLLABLES", Рь: "STAGING", Ж: "WORDS" } as Record<string, SoundStage> },
    { firstName: "Вера", lastName: "Кузнецова", birth: "2020-01-15", color: "#059669", parent: null, conclusion: "Задержка речевого развития.", program: null, sounds: { К: "STAGING", Г: "NOT_STARTED" } as Record<string, SoundStage> },
  ];

  const tariff8 = await db.tariff.create({ data: { therapistId: t.id, name: "Абонемент на 8 занятий", lessonsCount: 8, price: 12000, validDays: 60 } });
  await db.tariff.create({ data: { therapistId: t.id, name: "Абонемент на 4 занятия", lessonsCount: 4, price: 6400, validDays: 35 } });
  await db.tariff.create({ data: { therapistId: t.id, name: "Разовое занятие", lessonsCount: 1, price: 1800 } });

  const materials = await Promise.all([
    db.material.create({ data: { ownerId: t.id, title: "Слова на звук Р в начале слова", type: "TEXT", text: "Рак, рама, рыба, рука, ракета, радуга, ромашка, рюкзак, ручка, роза", tags: ["Р", "автоматизация", "слова"] } }),
    db.material.create({ data: { ownerId: t.id, title: "Чистоговорки на С", type: "TEXT", text: "Са-са-са — вот летит оса.\nСу-су-су — видели лису.\nСы-сы-сы — у кота усы.", tags: ["С", "автоматизация", "слоги"] } }),
    db.material.create({ data: { ownerId: null, title: "Артикуляционная гимнастика: комплекс для Р", type: "VIDEO", url: "https://rutube.ru/", description: "Упражнения «Лошадка», «Грибок», «Маляр». Повторять перед зеркалом 5–7 минут.", tags: ["Р", "гимнастика"] } }),
    db.material.create({ data: { ownerId: null, title: "Дифференциация С–Ш: картинки", type: "LINK", url: "https://example.com/s-sh", description: "Разложить картинки на две группы.", tags: ["С", "Ш", "дифференциация"] } }),
  ]);

  const series = [
    { weekday: 1, time: "16:00" }, { weekday: 3, time: "17:00" }, { weekday: 2, time: "15:30" }, { weekday: 4, time: "18:00" },
  ];
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });

  for (const [i, k] of kids.entries()) {
    const s = await db.student.create({
      data: { therapistId: t.id, firstName: k.firstName, lastName: k.lastName, birthDate: new Date(k.birth), color: k.color, conclusion: k.conclusion, program: k.program },
    });
    if (k.parent) await db.studentParent.create({ data: { studentId: s.id, parentId: k.parent, relation: k.parent === mom.id ? "Мама" : "Папа" } });
    else await db.invite.create({ data: { studentId: s.id, therapistId: t.id, code: "demo-vera", phone: "+79990000003" } });

    for (const [sound, stage] of Object.entries(k.sounds)) {
      await db.soundProgress.create({ data: { studentId: s.id, sound, stage } });
      await db.soundProgressLog.create({ data: { studentId: s.id, sound, stage, createdAt: subWeeks(new Date(), 2) } });
    }

    const sub = await db.subscription.create({
      data: { therapistId: t.id, studentId: s.id, tariffId: tariff8.id, name: tariff8.name, lessonsTotal: 8, price: 12000, startDate: subWeeks(monday, 6), expiresAt: addDays(subWeeks(monday, 6), 60) },
    });
    await db.payment.create({ data: { therapistId: t.id, studentId: s.id, subscriptionId: sub.id, amount: i === 2 ? 6000 : 12000, method: i % 2 ? "CASH" : "TRANSFER", paidAt: subWeeks(monday, 6) } });

    const sr = series[i];
    const ls = await db.lessonSeries.create({ data: { studentId: s.id, weekday: sr.weekday, time: sr.time, durationMin: 45, startDate: subWeeks(monday, 6) } });
    const [h, m] = sr.time.split(":").map(Number);
    for (let w = -6; w < 6; w++) {
      const day = addDays(addWeeks(monday, w), sr.weekday - 1);
      const startsAt = setMinutes(setHours(startOfDay(day), h), m);
      const past = startsAt < new Date();
      const status: LessonStatus = !past ? "PLANNED" : w === -3 && i === 1 ? "MISSED" : w === -2 && i === 0 ? "CANCELED" : "DONE";
      await db.lesson.create({
        data: {
          therapistId: t.id, studentId: s.id, seriesId: ls.id, startsAt, durationMin: 45, status,
          subscriptionId: status === "DONE" || status === "MISSED" ? sub.id : null,
          note: status === "DONE" && w === -1 ? "Хорошо работал, устал к концу. Повторить гимнастику." : null,
          noteForParent: status === "DONE" && w === -1 ? "Сегодня звук хорошо получался в слогах. Дома — чистоговорки 2 раза в день." : null,
        },
      });
    }

    if (k.parent) {
      await db.homework.create({
        data: {
          therapistId: t.id, studentId: s.id, title: i === 1 ? "Дифференциация С–Ш" : "Автоматизация звука в словах",
          instructions: "Заниматься 10 минут каждый день. Запишите аудио, как ребёнок проговаривает слова.",
          dueDate: addDays(new Date(), 4), materials: { create: [{ materialId: materials[i === 1 ? 3 : 0].id }, { materialId: materials[2].id }] },
        },
      });
      const done = await db.homework.create({
        data: {
          therapistId: t.id, studentId: s.id, title: "Чистоговорки на С", status: i === 0 ? "SUBMITTED" : "REVIEWED",
          feedback: i === 0 ? null : "Отлично! Звук С в слогах уверенный.", grade: i === 0 ? null : 5,
          createdAt: subWeeks(new Date(), 1), materials: { create: [{ materialId: materials[1].id }] },
        },
      });
      await db.homeworkSubmission.create({ data: { homeworkId: done.id, authorId: k.parent, comment: "Повторяли каждый вечер, лучше всего получается «са-са-са»." } });
    }
  }

  await db.notification.createMany({
    data: [
      { userId: t.id, title: "Сдано домашнее задание", body: "Миша: Чистоговорки на С", link: "/therapist/homework" },
      { userId: mom.id, title: "Новое домашнее задание", body: "Автоматизация звука в словах", link: "/parent/homework" },
    ],
  });
  console.log("Демо-данные готовы");
}

main().finally(() => db.$disconnect());
