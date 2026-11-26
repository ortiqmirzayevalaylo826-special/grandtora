import { Injectable, Logger, Module } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.module';
import { MailService } from '../mail/mail.module';

/**
 * Muddat eslatmalari: 7 / 3 / 1 kun qolganda. Har bir (foydalanuvchi, dastur, daraja) uchun BIR MARTA
 * — Notification.dedupeKey unique bo'lgani uchun takroriy ishga tushirish dublikat yaratmaydi.
 * (Keyingi bosqich: BullMQ navbatiga ko'chirish — bir nechta server nusxasi bo'lganda.)
 */
@Injectable()
export class RemindersJob {
  private log = new Logger('Reminders');
  constructor(private db: PrismaService, private mail: MailService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async run() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (const level of [7, 3, 1]) {
      const from = new Date(today.getTime() + level * 864e5);
      const to = new Date(from.getTime() + 864e5);
      const dueSoon = await this.db.scholarship.findMany({
        where: { status: 'PUBLISHED', deadline: { gte: from, lt: to } },
        include: { translations: true, saved: { include: { user: true } }, applications: { include: { user: true } } },
      });
      for (const s of dueSoon) {
        const users = new Map<string, any>();
        s.saved.forEach((x) => users.set(x.userId, x.user));
        s.applications.filter((a) => !['ACCEPTED', 'REJECTED', 'SUBMITTED'].includes(a.status)).forEach((a) => users.set(a.userId, a.user));
        for (const u of users.values()) {
          if (u.blockedAt) continue;
          const key = `rem:${u.id}:${s.id}:${level}`;
          const r = await this.db.notification.createMany({
            data: [{ userId: u.id, type: 'DEADLINE_REMINDER', dedupeKey: key, payload: { scholarshipId: s.id, slug: s.slug, level } }],
            skipDuplicates: true,
          });
          if (r.count && u.emailReminders) {
            const title = (s.translations.find((t) => t.locale === u.locale) ?? s.translations[0])?.title ?? s.slug;
            await this.mail.sendReminder(u.email, title, level, u.locale);
          }
        }
      }
    }
    this.log.log('Eslatmalar tekshirildi');
  }

  /** Muddati o'tgan dasturlarni avtomatik EXPIRED qiladi (rolling bo'lmaganlar). */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async expire() {
    const r = await this.db.scholarship.updateMany({ where: { status: 'PUBLISHED', rolling: false, deadline: { lt: new Date() } }, data: { status: 'EXPIRED' } });
    if (r.count) this.log.log(`${r.count} ta dastur EXPIRED qilindi`);
  }
}

@Module({ providers: [RemindersJob] })
export class JobsModule {}
