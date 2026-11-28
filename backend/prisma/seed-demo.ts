/**
 * DEMO foydalanuvchilar (kurs loyihasi va sinov uchun). Faqat SEED_DEMO_USERS=true bo'lganda yaratiladi.
 * Parol: DEMO_PASSWORD (berilmasa — standart, README da yozilgan). Haqiqiy ishga tushirishda SEED_DEMO_USERS ni o'chiring!
 *
 * Rollar: ADMIN va STUDENT. Har biri uchun akkaunt bor, shuningdek bloklangan akkaunt (admin bloklash funksiyasini ko'rsatish uchun).
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { demoContent } from './seed-demo-data';

export const DEMO_ACCOUNTS = [
  { email: 'demo.student1@grantora.demo', role: 'STUDENT', note: "Madina — to'ldirilgan profil, saqlanganlar, arizalar, eslatma" },
  { email: 'demo.student2@grantora.demo', role: 'STUDENT', note: "Jasur — yangi, bo'sh akkaunt" },
  { email: 'demo.blocked@grantora.demo', role: 'STUDENT', note: 'Bloklangan akkaunt — kira olmaydi' },
];

export async function demoUsers(db: PrismaClient) {
  const pw = process.env.DEMO_PASSWORD ?? 'Demo#2026pass';
  const hash = await bcrypt.hash(pw, 12);
  const mk = (email: string, role: 'ADMIN' | 'STUDENT', first: string, last: string, blocked = false) =>
    db.user.upsert({
      where: { email },
      update: { passwordHash: hash, blockedAt: blocked ? new Date() : null },
      create: { email, passwordHash: hash, role, firstName: first, lastName: last, emailVerifiedAt: new Date(), blockedAt: blocked ? new Date() : null, profile: { create: {} } },
    });

  // Admin uchun demo akkaunt yo'q; avval yaratilgan bo'lsa olib tashlaymiz
  await db.user.deleteMany({ where: { email: 'demo.admin@grantora.demo' } });
  const s1 = await mk('demo.student1@grantora.demo', 'STUDENT', 'Madina', 'Karimova');
  await mk('demo.student2@grantora.demo', 'STUDENT', 'Jasur', 'Rahimov');
  await mk('demo.blocked@grantora.demo', 'STUDENT', 'Bloklangan', 'Foydalanuvchi', true);

  await db.profile.upsert({
    where: { userId: s1.id }, update: {},
    create: { userId: s1.id, country: 'UZ', university: 'Toshkent axborot texnologiyalari universiteti', faculty: 'Dasturiy injiniring', major: 'Software Engineering', level: 'BACHELOR', gpa: 3.6, ielts: 6.5, birthYear: 2004, languages: ['uz', 'ru', 'en'], interests: "Sun'iy intellekt, ma'lumotlar tahlili", achievements: 'Respublika olimpiadasi finalisti' },
  });

  const grants = await db.scholarship.findMany({ where: { slug: { in: ['daad-scholarships', 'chevening', 'fulbright-foreign-student', 'turkiye-burslari'] } } });
  const by = (slug: string) => grants.find((g) => g.slug === slug);
  for (const g of grants.slice(0, 3)) {
    await db.savedScholarship.upsert({ where: { userId_scholarshipId: { userId: s1.id, scholarshipId: g.id } }, update: {}, create: { userId: s1.id, scholarshipId: g.id } });
  }
  const apps: [string, 'INTERESTED' | 'PREPARING' | 'SUBMITTED'][] = [['daad-scholarships', 'PREPARING'], ['turkiye-burslari', 'SUBMITTED'], ['chevening', 'INTERESTED']];
  for (const [slug, status] of apps) {
    const g = by(slug);
    if (g) await db.application.upsert({ where: { userId_scholarshipId: { userId: s1.id, scholarshipId: g.id } }, update: {}, create: { userId: s1.id, scholarshipId: g.id, status, note: 'Demo ariza' } });
  }
  // Madinaning ariza topshirishi: admin "Arizalar" bo'limida ko'rinadi (demo)
  const tb = by('turkiye-burslari');
  if (tb) await db.application.updateMany({ where: { userId: s1.id, scholarshipId: tb.id, review: null }, data: { review: 'SUBMITTED', motivation: "Men dasturiy injiniringda tahsil olyapman va Turkiyada magistraturada o'qib, sohamdagi ilg'or tajribani O'zbekistonga olib kelmoqchiman.", submittedAt: new Date() } });
  const d = by('daad-scholarships');
  const k1 = `demo-${s1.id}-7`, k2 = `demo-${s1.id}-sys`;
  if (d) await db.notification.upsert({ where: { dedupeKey: k1 }, update: {}, create: { userId: s1.id, type: 'DEADLINE_REMINDER', dedupeKey: k1, payload: { scholarshipId: d.id, slug: d.slug, level: 7 } } });
  await db.notification.upsert({ where: { dedupeKey: k2 }, update: {}, create: { userId: s1.id, type: 'SYSTEM', dedupeKey: k2, payload: {} } });
  // ---- Demo kontent: admin paneli bo'sh ko'rinmasligi uchun (takroran ishga tushirilsa ham ikkilanmaydi) ----
  const s2 = await db.user.findUnique({ where: { email: 'demo.student2@grantora.demo' } });
  const ch = by('chevening');
  if (d && !(await db.review.findFirst({ where: { userId: s1.id, scholarshipId: d.id } }))) {
    await db.review.create({ data: { userId: s1.id, scholarshipId: d.id, stars: 5, text: "Ma'lumotlar aniq va tushunarli, hujjatlar ro'yxati juda yordam berdi.", status: 'APPROVED' } });
  }
  if (ch && s2 && !(await db.review.findFirst({ where: { userId: s2.id, scholarshipId: ch.id } }))) {
    await db.review.create({ data: { userId: s2.id, scholarshipId: ch.id, stars: 4, text: "Yaxshi grant, lekin ariza muddati juda yaqin ekan. Ko'proq eslatma bo'lsa yaxshi.", status: 'PENDING' } });
  }
  const adm = await db.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
  if (adm) {
    const conv = await db.conversation.upsert({ where: { studentId: s1.id }, update: {}, create: { studentId: s1.id } });
    if ((await db.chatMessage.count({ where: { conversationId: conv.id } })) === 0) {
      const t = (min: number) => new Date(Date.now() - min * 60_000);
      await db.chatMessage.createMany({ data: [
        { conversationId: conv.id, senderId: s1.id, fromAdmin: false, body: "Assalomu alaykum! DAAD uchun IELTS shartmi?", createdAt: t(180), readAt: t(170) },
        { conversationId: conv.id, senderId: adm.id, fromAdmin: true, body: "Va alaykum assalom! Ko'p dasturlar uchun ingliz yoki nemis tili sertifikati kerak. Grant sahifasidagi talablarni tekshiring.", createdAt: t(170), readAt: t(160) },
        { conversationId: conv.id, senderId: s1.id, fromAdmin: false, body: "Rahmat! Hujjatlarni yuklab qo'yaman.", createdAt: t(20) },
      ] });
      await db.conversation.update({ where: { id: conv.id }, data: { lastMessageAt: t(20) } });
    }
  }
  if (s2 && !(await db.complaint.findFirst({ where: { reporterId: s2.id } }))) {
    await db.complaint.create({ data: { reporterId: s2.id, kind: 'GRANT', subject: "Grant muddati noto'g'ri ko'rsatilgan", text: "Chevening sahifasida muddat o'tib ketgan, lekin rasmiy saytda hali ochiq. Iltimos, tekshirib ko'ring." } });
  }
  await demoContent(db, hash);
  console.log('Demo foydalanuvchilar tayyor:', DEMO_ACCOUNTS.map((a) => a.email).join(', '));
}
