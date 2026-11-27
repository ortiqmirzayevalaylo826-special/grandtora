/**
 * DEMO foydalanuvchilar (kurs loyihasi va sinov uchun). Faqat SEED_DEMO_USERS=true bo'lganda yaratiladi.
 * Parol: DEMO_PASSWORD (berilmasa — standart, README da yozilgan). Haqiqiy ishga tushirishda SEED_DEMO_USERS ni o'chiring!
 *
 * Rollar: ADMIN va STUDENT. Har biri uchun akkaunt bor, shuningdek bloklangan akkaunt (admin bloklash funksiyasini ko'rsatish uchun).
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export const DEMO_ACCOUNTS = [
  { email: 'demo.admin@grantora.demo', role: 'ADMIN', note: "Administrator — /admin paneli" },
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

  await mk('demo.admin@grantora.demo', 'ADMIN', 'Demo', 'Admin');
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
  const d = by('daad-scholarships');
  const k1 = `demo-${s1.id}-7`, k2 = `demo-${s1.id}-sys`;
  if (d) await db.notification.upsert({ where: { dedupeKey: k1 }, update: {}, create: { userId: s1.id, type: 'DEADLINE_REMINDER', dedupeKey: k1, payload: { scholarshipId: d.id, slug: d.slug, level: 7 } } });
  await db.notification.upsert({ where: { dedupeKey: k2 }, update: {}, create: { userId: s1.id, type: 'SYSTEM', dedupeKey: k2, payload: {} } });
  console.log('Demo foydalanuvchilar tayyor:', DEMO_ACCOUNTS.map((a) => a.email).join(', '));
}
