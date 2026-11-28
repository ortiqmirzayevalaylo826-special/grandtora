import {
  BadRequestException, Body, Controller, Delete, Get, HttpCode, Module, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Put, Query, Res,
  UploadedFile, UseGuards, UseInterceptors, UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { ApplicationStatus, StudyLevel } from '@prisma/client';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.module';
import { StorageService } from '../storage/storage.module';
import { AuthUser, CurrentUser, JwtAuthGuard } from '../common/auth';
import { matchScore, toNum } from '../common/match';
import { ScholarshipsService } from '../scholarships/scholarships.service';

const PW = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

class ProfileDto {
  @IsOptional() @IsString() @MaxLength(30) phone?: string | null;
  @IsOptional() @IsString() @MaxLength(80) country?: string | null;
  @IsOptional() @IsString() @MaxLength(120) university?: string | null;
  @IsOptional() @IsString() @MaxLength(120) faculty?: string | null;
  @IsOptional() @IsString() @MaxLength(40) major?: string | null;
  @IsOptional() @IsEnum(StudyLevel) level?: StudyLevel | null;
  @IsOptional() @IsNumber() @Min(0) @Max(4) gpa?: number | null;
  @IsOptional() @IsNumber() @Min(0) @Max(9) ielts?: number | null;
  @IsOptional() @IsInt() @Min(1950) @Max(2100) birthYear?: number | null;
  @IsOptional() @IsArray() @IsString({ each: true }) languages?: string[];
  @IsOptional() @IsString() @MaxLength(500) interests?: string | null;
  @IsOptional() @IsString() @MaxLength(1000) achievements?: string | null;
}
class AppDto {
  @IsOptional() @IsEnum(ApplicationStatus) status?: ApplicationStatus;
  @IsOptional() @IsString() @MaxLength(500) note?: string | null;
  @IsOptional() @IsArray() @IsBoolean({ each: true }) checklist?: boolean[];
}
class SubmitDto {
  @IsString() @MinLength(30) @MaxLength(2000) motivation: string;
  @IsArray() @ArrayMaxSize(10) @IsUUID('all', { each: true }) docIds: string[];
}
class ReportDto { @IsString() @MinLength(5) @MaxLength(500) text: string }
class ReviewDto { @IsInt() @Min(1) @Max(5) stars: number; @IsString() @MinLength(10) @MaxLength(1000) text: string }
class AccountDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(60) firstName?: string;
  @IsOptional() @IsString() @MaxLength(60) lastName?: string;
  @IsOptional() @IsIn(['uz', 'ru', 'en']) locale?: 'uz' | 'ru' | 'en';
}
class SettingsDto { @IsOptional() @IsBoolean() emailReminders?: boolean }
class PasswordDto { @IsString() @MaxLength(72) current: string; @Matches(PW, { message: 'weak_password' }) next: string }
class DeleteDto { @IsString() @MaxLength(72) password: string }

// Fayl turi MIME'ga emas, haqiqiy boshlang'ich baytlarga qarab aniqlanadi (soxta kengaytmadan himoya)
function sniff(b: Buffer): { ext: string; mime: string } | null {
  if (b.length > 4 && b.subarray(0, 4).toString('latin1') === '%PDF') return { ext: 'pdf', mime: 'application/pdf' };
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: 'png', mime: 'image/png' };
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  return null;
}
const MAX_DOCS = 20;
const MAX_FILE = 5 * 1024 * 1024;

/** Barcha yo'llar faqat o'z ma'lumotlari bilan ishlaydi: userId doim tokendan olinadi (IDOR yo'q). */
@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(private db: PrismaService, private sch: ScholarshipsService, private store: StorageService) {}

  // ---- umumiy ko'rinish ----
  @Get('overview') async overview(@CurrentUser() u: AuthUser, @Query('locale') locale?: string) {
    const [p, saved, apps, unread, docs] = await Promise.all([
      this.db.profile.findUnique({ where: { userId: u.id } }),
      this.db.savedScholarship.findMany({ where: { userId: u.id }, include: { scholarship: { include: { translations: true, country: true } } } }),
      this.db.application.findMany({ where: { userId: u.id }, include: { scholarship: { include: { translations: true, country: true } } } }),
      this.db.notification.count({ where: { userId: u.id, readAt: null } }),
      this.db.document.count({ where: { userId: u.id } }),
    ]);
    const fields: (keyof NonNullable<typeof p>)[] = ['phone', 'country', 'university', 'major', 'level', 'gpa', 'ielts', 'birthYear'];
    const filled = p ? fields.filter((f) => p[f] != null && p[f] !== '').length + (p.languages?.length ? 1 : 0) : 0;
    const now = Date.now();
    const seen = new Set<string>();
    const upcoming = [...apps.map((a) => a.scholarship), ...saved.map((s) => s.scholarship)]
      .filter((s) => s.deadline && s.deadline.getTime() >= now && !seen.has(s.id) && seen.add(s.id))
      .sort((a, b) => a.deadline!.getTime() - b.deadline!.getTime()).slice(0, 5)
      .map((s) => this.sch.present(s, locale));
    const byStatus: Record<string, number> = {};
    apps.forEach((a) => { byStatus[a.status] = (byStatus[a.status] ?? 0) + 1; });
    return { saved: saved.length, applications: apps.length, unread, documents: docs, byStatus, profilePercent: Math.round((filled / (fields.length + 1)) * 100), upcoming };
  }

  /** Detal sahifasida "saqlangan / kuzatuvda" holatini ko'rsatish uchun */
  @Get('ids') async ids(@CurrentUser() u: AuthUser) {
    const [s, a] = await Promise.all([
      this.db.savedScholarship.findMany({ where: { userId: u.id }, select: { scholarshipId: true } }),
      this.db.application.findMany({ where: { userId: u.id }, select: { scholarshipId: true } }),
    ]);
    return { saved: s.map((x) => x.scholarshipId), applications: a.map((x) => x.scholarshipId) };
  }

  // ---- profil va sozlamalar ----
  @Get('profile') profile(@CurrentUser() u: AuthUser) { return this.db.profile.findUnique({ where: { userId: u.id } }); }
  @Put('profile') async saveProfile(@CurrentUser() u: AuthUser, @Body() dto: ProfileDto) {
    return this.db.profile.upsert({ where: { userId: u.id }, create: { userId: u.id, ...dto }, update: dto });
  }
  @Get('settings') settings(@CurrentUser() u: AuthUser) { return this.db.user.findUnique({ where: { id: u.id }, select: { emailReminders: true, locale: true, email: true } }); }
  @Patch('settings') saveSettings(@CurrentUser() u: AuthUser, @Body() dto: SettingsDto) {
    return this.db.user.update({ where: { id: u.id }, data: dto, select: { emailReminders: true } });
  }

  @Post('password') async password(@CurrentUser() u: AuthUser, @Body() dto: PasswordDto) {
    const row = await this.db.user.findUnique({ where: { id: u.id } });
    if (!row || !(await bcrypt.compare(dto.current, row.passwordHash))) throw new UnauthorizedException('invalid_credentials');
    await this.db.user.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash(dto.next, 12) } });
    await this.db.refreshToken.updateMany({ where: { userId: u.id, revokedAt: null }, data: { revokedAt: new Date() } }); // boshqa qurilmalar chiqib ketadi
    return { ok: true };
  }

  /** Hisobni o'chirish: parol bilan tasdiqlanadi; barcha bog'liq ma'lumot (cascade) va fayllar o'chadi. */
  @Delete() async deleteAccount(@CurrentUser() u: AuthUser, @Body() dto: DeleteDto) {
    const row = await this.db.user.findUnique({ where: { id: u.id }, include: { documents: true } });
    if (!row || !(await bcrypt.compare(dto.password, row.passwordHash))) throw new UnauthorizedException('invalid_credentials');
    if (row.role === 'ADMIN') throw new BadRequestException('admin_cannot_self_delete');
    await Promise.all(row.documents.map((d) => this.store.remove(d.storageKey)));
    await this.db.user.delete({ where: { id: u.id } });
    return { ok: true };
  }

  // ---- saqlanganlar ----
  @Get('saved') async saved(@CurrentUser() u: AuthUser, @Query('locale') locale?: string) {
    const rows = await this.db.savedScholarship.findMany({ where: { userId: u.id }, include: { scholarship: { include: { translations: true, country: true } } }, orderBy: { createdAt: 'desc' } });
    return rows.map((r) => this.sch.present(r.scholarship, locale));
  }
  @Put('saved/:id') async save(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.mustExistPublished(id);
    await this.db.savedScholarship.upsert({ where: { userId_scholarshipId: { userId: u.id, scholarshipId: id } }, create: { userId: u.id, scholarshipId: id }, update: {} });
    return { saved: true };
  }
  @Delete('saved/:id') async unsave(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.db.savedScholarship.deleteMany({ where: { userId: u.id, scholarshipId: id } });
    return { saved: false };
  }

  // ---- arizalar kuzatuvi ----
  @Get('applications') async apps(@CurrentUser() u: AuthUser, @Query('locale') locale?: string) {
    const rows = await this.db.application.findMany({ where: { userId: u.id }, include: { scholarship: { include: { translations: true, country: true } } }, orderBy: { updatedAt: 'desc' } });
    return rows.map((a) => ({ ...a, scholarship: this.sch.present(a.scholarship, locale) }));
  }
  @Put('applications/:sid') async track(@CurrentUser() u: AuthUser, @Param('sid', ParseUUIDPipe) sid: string) {
    await this.mustExistPublished(sid);
    return this.db.application.upsert({ where: { userId_scholarshipId: { userId: u.id, scholarshipId: sid } }, create: { userId: u.id, scholarshipId: sid }, update: {} });
  }
  @Patch('applications/:sid') async updateApp(@CurrentUser() u: AuthUser, @Param('sid', ParseUUIDPipe) sid: string, @Body() dto: AppDto) {
    const cur = await this.db.application.findUnique({ where: { userId_scholarshipId: { userId: u.id, scholarshipId: sid } } });
    if (!cur) throw new NotFoundException();
    return this.db.application.update({
      where: { id: cur.id },
      data: { ...dto, submittedAt: dto.status === 'SUBMITTED' && !cur.submittedAt ? new Date() : undefined },
    });
  }
  /** Arizani platformaga topshirish: motivatsiya + hujjatlar. Admin ko'rib chiqadi, javob bildirishnomada keladi. */
  @Post('applications/:sid/submit') @HttpCode(200) async submitApp(@CurrentUser() u: AuthUser, @Param('sid', ParseUUIDPipe) sid: string, @Body() dto: SubmitDto) {
    const cur = await this.db.application.findUnique({ where: { userId_scholarshipId: { userId: u.id, scholarshipId: sid } } });
    if (!cur) throw new NotFoundException();
    if (cur.review && cur.review !== 'NEEDS_INFO') throw new BadRequestException('already_submitted');
    const ids = [...new Set(dto.docIds)];
    if (ids.length === 0) throw new BadRequestException('docs_required');
    const own = await this.db.document.count({ where: { userId: u.id, id: { in: ids } } });
    if (own !== ids.length) throw new BadRequestException('bad_documents');
    const profile = await this.db.profile.findUnique({ where: { userId: u.id } });
    if (!profile?.country || !profile?.university) throw new BadRequestException('profile_incomplete');
    return this.db.application.update({
      where: { id: cur.id },
      data: { motivation: dto.motivation.trim(), docIds: ids, review: 'SUBMITTED', reviewNote: null, reviewedAt: null, status: cur.status === 'INTERESTED' || cur.status === 'PREPARING' ? 'SUBMITTED' : undefined, submittedAt: cur.submittedAt ?? new Date() },
    });
  }
  @Delete('applications/:sid') async untrack(@CurrentUser() u: AuthUser, @Param('sid', ParseUUIDPipe) sid: string) {
    await this.db.application.deleteMany({ where: { userId: u.id, scholarshipId: sid } });
    return { ok: true };
  }

  // ---- tavsiyalar (moslik foizi bilan) ----
  @Get('recommended') async recommended(@CurrentUser() u: AuthUser, @Query('locale') locale?: string) {
    const p = await this.db.profile.findUnique({ where: { userId: u.id } });
    const age = p?.birthYear ? new Date().getFullYear() - p.birthYear : null;
    const rows = await this.db.scholarship.findMany({ where: { status: 'PUBLISHED', OR: [{ rolling: true }, { deadline: { gte: new Date() } }] }, include: { translations: true, country: true }, take: 200 });
    return rows
      .map((s) => ({
        ...this.sch.present(s, locale),
        match: matchScore(
          { levels: s.levels, fields: s.fields, ieltsMin: toNum(s.ieltsMin), gpaMin: toNum(s.gpaMin), ageMin: s.ageMin, ageMax: s.ageMax },
          { level: p?.level, major: p?.major, gpa: toNum(p?.gpa), ielts: toNum(p?.ielts), age },
        ),
      }))
      .sort((a, b) => b.match.percent - a.match.percent).slice(0, 30);
  }

  // ---- bildirishnomalar ----
  @Get('notifications') async notifs(@CurrentUser() u: AuthUser) {
    const rows = await this.db.notification.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, take: 100 });
    // payload ichidagi dastur nomini til bilan birga qaytarish uchun
    const ids = [...new Set(rows.map((r) => (r.payload as any)?.scholarshipId).filter(Boolean))] as string[];
    const sch = ids.length ? await this.db.scholarship.findMany({ where: { id: { in: ids } }, include: { translations: true } }) : [];
    return rows.map((r) => ({ ...r, scholarship: sch.find((s) => s.id === (r.payload as any)?.scholarshipId) ? this.sch.present(sch.find((s) => s.id === (r.payload as any)?.scholarshipId)) : null }));
  }
  @Post('notifications/:id/read') async readOne(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) { await this.db.notification.updateMany({ where: { id, userId: u.id, readAt: null }, data: { readAt: new Date() } }); return { ok: true }; }
  @Post('notifications/read') async readAll(@CurrentUser() u: AuthUser) { await this.db.notification.updateMany({ where: { userId: u.id, readAt: null }, data: { readAt: new Date() } }); return { ok: true }; }

  // ---- hisob, rasm, qurilmalar, ma'lumotni yuklab olish ----
  private pub(r: { id: string; email: string; role: string; firstName: string; lastName: string; locale: string; avatarKey: string | null }) {
    return { id: r.id, email: r.email, role: r.role, firstName: r.firstName, lastName: r.lastName, locale: r.locale, avatar: r.avatarKey ? r.avatarKey.split('/').pop() : null };
  }
  @Patch('account') async account(@CurrentUser() u: AuthUser, @Body() d: AccountDto) {
    const r = await this.db.user.update({ where: { id: u.id }, data: { ...(d.firstName !== undefined ? { firstName: d.firstName.trim() } : {}), ...(d.lastName !== undefined ? { lastName: d.lastName.trim() } : {}), ...(d.locale ? { locale: d.locale } : {}) } });
    return this.pub(r);
  }
  @Post('avatar') @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024, files: 1 } }))
  async setAvatar(@CurrentUser() u: AuthUser, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('file_required');
    const kind = sniff(file.buffer);
    if (!kind || !kind.mime.startsWith('image/')) throw new BadRequestException('image_type_not_allowed');
    const key = `avatars/${u.id}/${randomUUID()}.${kind.ext}`;
    await this.store.put(key, file.buffer, kind.mime);
    const old = await this.db.user.findUnique({ where: { id: u.id }, select: { avatarKey: true } });
    const r = await this.db.user.update({ where: { id: u.id }, data: { avatarKey: key, avatarMime: kind.mime } });
    if (old?.avatarKey) await this.store.remove(old.avatarKey).catch(() => undefined);
    return this.pub(r);
  }
  @Get('avatar') async avatar(@CurrentUser() u: AuthUser, @Res() res: Response) {
    const r = await this.db.user.findUnique({ where: { id: u.id }, select: { avatarKey: true, avatarMime: true } });
    if (!r?.avatarKey) throw new NotFoundException();
    const buf = await this.store.get(r.avatarKey);
    res.setHeader('Content-Type', r.avatarMime ?? 'image/jpeg');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.send(buf);
  }
  @Delete('avatar') async delAvatar(@CurrentUser() u: AuthUser) {
    const r = await this.db.user.findUnique({ where: { id: u.id }, select: { avatarKey: true } });
    if (r?.avatarKey) await this.store.remove(r.avatarKey).catch(() => undefined);
    const x = await this.db.user.update({ where: { id: u.id }, data: { avatarKey: null, avatarMime: null } });
    return this.pub(x);
  }
  @Get('sessions') sessions(@CurrentUser() u: AuthUser) {
    return this.db.refreshToken.findMany({ where: { userId: u.id, revokedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, userAgent: true, createdAt: true } });
  }
  @Delete('sessions/:id') async endSession(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.db.refreshToken.updateMany({ where: { id, userId: u.id, revokedAt: null }, data: { revokedAt: new Date() } });
    return { ok: true };
  }
  @Delete('sessions') async endAllSessions(@CurrentUser() u: AuthUser) {
    const r = await this.db.refreshToken.updateMany({ where: { userId: u.id, revokedAt: null }, data: { revokedAt: new Date() } });
    return { ended: r.count };
  }
  @Get('export') async exportData(@CurrentUser() u: AuthUser) {
    const [user, profile, saved, apps, docs, reviews, complaints] = await Promise.all([
      this.db.user.findUnique({ where: { id: u.id }, select: { email: true, firstName: true, lastName: true, locale: true, createdAt: true, emailReminders: true } }),
      this.db.profile.findUnique({ where: { userId: u.id } }),
      this.db.savedScholarship.findMany({ where: { userId: u.id }, include: { scholarship: { select: { slug: true, organization: true } } } }),
      this.db.application.findMany({ where: { userId: u.id }, include: { scholarship: { select: { slug: true } } } }),
      this.db.document.findMany({ where: { userId: u.id }, select: { name: true, mime: true, sizeBytes: true, createdAt: true } }),
      this.db.review.findMany({ where: { userId: u.id }, select: { stars: true, text: true, status: true, createdAt: true } }),
      this.db.complaint.findMany({ where: { reporterId: u.id }, select: { num: true, kind: true, subject: true, text: true, status: true, resolution: true, createdAt: true } }),
    ]);
    return { exportedAt: new Date().toISOString(), user, profile, saved: saved.map((x) => x.scholarship.slug), applications: apps.map((a: any) => ({ grant: a.scholarship.slug, status: a.status, note: a.note, createdAt: a.createdAt })), documents: docs, reviews, complaints };
  }

  // ---- hujjatlar (PDF/JPG/PNG, 5 MB gacha) ----
  @Get('documents') documents(@CurrentUser() u: AuthUser) {
    return this.db.document.findMany({ where: { userId: u.id }, select: { id: true, name: true, mime: true, sizeBytes: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
  }
  @Post('documents') @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE, files: 1 } }))
  async upload(@CurrentUser() u: AuthUser, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('file_required');
    if ((await this.db.document.count({ where: { userId: u.id } })) >= MAX_DOCS) throw new BadRequestException('too_many_documents');
    const kind = sniff(file.buffer);
    if (!kind) throw new BadRequestException('file_type_not_allowed');
    // Asl nom faqat ko'rsatish uchun: boshqaruv belgilari va yo'l ajratgichlari olib tashlanadi; saqlash kaliti — tasodifiy UUID
    const clean = Buffer.from(file.originalname, 'latin1').toString('utf8').replace(/[\\/\u0000-\u001f<>:"|?*]/g, '_').slice(0, 120) || `file.${kind.ext}`;
    const storageKey = `${u.id}/${randomUUID()}.${kind.ext}`;
    await this.store.put(storageKey, file.buffer, kind.mime);
    return this.db.document.create({ data: { userId: u.id, name: clean, mime: kind.mime, sizeBytes: file.size, storageKey }, select: { id: true, name: true, mime: true, sizeBytes: true, createdAt: true } });
  }
  @Get('documents/:id/download') async download(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const d = await this.db.document.findFirst({ where: { id, userId: u.id } }); // faqat egasi
    if (!d) throw new NotFoundException();
    const buf = await this.store.get(d.storageKey);
    res.setHeader('Content-Type', d.mime);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(d.name)}`);
    res.send(buf);
  }
  @Delete('documents/:id') async delDoc(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    const d = await this.db.document.findFirst({ where: { id, userId: u.id } });
    if (!d) throw new NotFoundException();
    await this.store.remove(d.storageKey);
    await this.db.document.delete({ where: { id } });
    return { ok: true };
  }

  // ---- fikr va xabarlar ----
  @Post('report/:sid') async report(@CurrentUser() u: AuthUser, @Param('sid', ParseUUIDPipe) sid: string, @Body() dto: ReportDto) {
    await this.mustExistPublished(sid);
    return this.db.problemReport.create({ data: { scholarshipId: sid, userId: u.id, text: dto.text } });
  }
  @Post('reviews/:sid') async review(@CurrentUser() u: AuthUser, @Param('sid', ParseUUIDPipe) sid: string, @Body() dto: ReviewDto) {
    await this.mustExistPublished(sid);
    if (await this.db.review.findFirst({ where: { userId: u.id, scholarshipId: sid } })) throw new BadRequestException('already_reviewed');
    await this.db.review.create({ data: { userId: u.id, scholarshipId: sid, stars: dto.stars, text: dto.text } }); // moderatsiyadan keyin ko'rinadi
    return { ok: true, pending: true };
  }

  private async mustExistPublished(id: string) {
    const s = await this.db.scholarship.findFirst({ where: { id, status: 'PUBLISHED' }, select: { id: true } });
    if (!s) throw new NotFoundException();
  }
}

@Module({ controllers: [MeController], providers: [ScholarshipsService] })
export class MeModule {}
