import { Body, Controller, Get, Module, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { ProgramKind } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.module';
import { ScholarshipsModule } from '../scholarships/scholarships.module';
import { ScholarshipsService } from '../scholarships/scholarships.service';

const LOCALES = ['uz', 'ru', 'en'];
const lang = (l?: string) => (l && LOCALES.includes(l) ? l : 'uz');
/** JSON matnlardan so'ralgan til, bo'lmasa o'zbekcha/inglizcha */
const pick = (i18n: any, l: string) => i18n?.[l] ?? i18n?.uz ?? i18n?.en ?? {};

class ContactDto {
  @IsString() @MinLength(2) @MaxLength(80) name: string;
  @IsEmail() @MaxLength(254) email: string;
  @IsString() @MinLength(2) @MaxLength(120) subject: string;
  @IsString() @MinLength(5) @MaxLength(4000) message: string;
  @IsOptional() @IsIn(LOCALES) locale?: string;
}
class SubscribeDto {
  @IsEmail() @MaxLength(254) email: string;
  @IsOptional() @IsIn(LOCALES) locale?: string;
}

@Controller()
export class PublicController {
  constructor(private db: PrismaService, private sch: ScholarshipsService) {}

  /** Bosh sahifa statistikasi: faqat haqiqiy sonlar */
  @Get('public/stats')
  async stats() {
    const now = new Date();
    const [scholarships, countries, programs, students] = await Promise.all([
      this.db.scholarship.count({ where: { status: 'PUBLISHED', OR: [{ rolling: true }, { deadline: { gte: now } }] } }),
      this.db.scholarship.groupBy({ by: ['countryCode'], where: { status: 'PUBLISHED' } }).then((r) => r.length),
      this.db.program.count({ where: { published: true } }),
      this.db.user.count({ where: { role: 'STUDENT', emailVerifiedAt: { not: null }, blockedAt: null } }),
    ]);
    return { scholarships, countries, programs, students };
  }

  // ---- Dasturlar ----
  @Get('programs')
  async programs(@Query('kind') kind?: string, @Query('locale') locale?: string) {
    const l = lang(locale);
    const rows = await this.db.program.findMany({
      where: { published: true, ...(kind && kind in ProgramKind ? { kind: kind as ProgramKind } : {}) },
      include: { country: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(({ i18n, ...r }) => ({ ...r, tr: pick(i18n, l) }));
  }
  @Get('programs/:slug')
  async program(@Param('slug') slug: string, @Query('locale') locale?: string) {
    const p = await this.db.program.findFirst({ where: { slug, published: true }, include: { country: true } });
    if (!p) throw new NotFoundException();
    const { i18n, ...r } = p;
    return { ...r, tr: pick(i18n, lang(locale)) };
  }

  // ---- Hikoyalar ----
  @Get('stories')
  async stories(@Query('locale') locale?: string) {
    const rows = await this.db.story.findMany({ where: { published: true }, include: { country: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
    return rows.map(({ i18n, ...r }) => ({ ...r, tr: pick(i18n, lang(locale)) }));
  }
  @Get('stories/:slug')
  async story(@Param('slug') slug: string, @Query('locale') locale?: string) {
    const s = await this.db.story.findFirst({ where: { slug, published: true }, include: { country: true } });
    if (!s) throw new NotFoundException();
    const { i18n, ...r } = s;
    return { ...r, tr: pick(i18n, lang(locale)) };
  }

  // ---- Davlatlar ----
  @Get('countries')
  async countries(@Query('locale') locale?: string) {
    const l = lang(locale);
    const now = new Date();
    const [rows, grouped, progs] = await Promise.all([
      this.db.country.findMany({ where: { code: { not: 'EU' } }, orderBy: { nameEn: 'asc' } }),
      this.db.scholarship.groupBy({ by: ['countryCode'], where: { status: 'PUBLISHED', OR: [{ rolling: true }, { deadline: { gte: now } }] }, _count: true }),
      this.db.program.groupBy({ by: ['countryCode'], where: { published: true, countryCode: { not: null } }, _count: true }),
    ]);
    const sc = new Map(grouped.map((g) => [g.countryCode, g._count]));
    const pc = new Map(progs.map((g) => [g.countryCode as string, g._count]));
    return rows.map((c) => ({
      code: c.code, name: l === 'ru' ? c.nameRu : l === 'en' ? c.nameEn : c.nameUz, universities: c.universities, eduLang: c.eduLang,
      info: (l === 'ru' ? c.infoRu : l === 'en' ? c.infoEn : c.infoUz) ?? c.infoEn ?? null,
      scholarships: sc.get(c.code) ?? 0, programs: pc.get(c.code) ?? 0,
    }));
  }
  @Get('countries/:code')
  async country(@Param('code') code: string, @Query('locale') locale?: string) {
    const l = lang(locale);
    const c = await this.db.country.findUnique({ where: { code: code.toUpperCase() } });
    if (!c) throw new NotFoundException();
    const [sch, programs] = await Promise.all([
      this.sch.list({ countries: [c.code], limit: 24, locale: l, sort: 'deadline' }),
      this.db.program.findMany({ where: { published: true, countryCode: c.code }, orderBy: { sortOrder: 'asc' } }),
    ]);
    return {
      code: c.code, name: l === 'ru' ? c.nameRu : l === 'en' ? c.nameEn : c.nameUz, universities: c.universities, eduLang: c.eduLang,
      info: (l === 'ru' ? c.infoRu : l === 'en' ? c.infoEn : c.infoUz) ?? c.infoEn ?? null,
      scholarships: sch.items, total: sch.total,
      programs: programs.map(({ i18n, ...r }) => ({ ...r, tr: pick(i18n, l) })),
    };
  }

  // ---- Aloqa va obuna (ochiq, tezlik cheklangan) ----
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('contact')
  async contact(@Body() d: ContactDto) {
    await this.db.contactMessage.create({ data: { name: d.name.trim(), email: d.email.toLowerCase(), subject: d.subject.trim(), message: d.message.trim(), locale: lang(d.locale) } });
    return { ok: true };
  }
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('subscribe')
  async subscribe(@Body() d: SubscribeDto) {
    await this.db.subscriber.upsert({ where: { email: d.email.toLowerCase() }, update: {}, create: { email: d.email.toLowerCase(), locale: lang(d.locale) } });
    return { ok: true }; // mavjud bo'lsa ham bir xil javob
  }
}

@Module({ imports: [ScholarshipsModule], controllers: [PublicController] })
export class PublicModule {}
