import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ScholarshipStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PrismaService } from '../prisma/prisma.module';

// ?countries=DE,UK va ?countries=DE&countries=UK ko'rinishlarini ham qabul qiladi
const csv = ({ value }: { value: unknown }) => {
  const arr = (Array.isArray(value) ? value : [value]).flatMap((v) => String(v ?? '').split(',')).map((s) => s.trim()).filter(Boolean);
  return arr.length ? arr : undefined;
};

export class ListQuery {
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @Transform(csv) @IsArray() countries?: string[];
  @IsOptional() @Transform(csv) @IsArray() levels?: string[];
  @IsOptional() @Transform(csv) @IsArray() funding?: string[];
  @IsOptional() @Transform(csv) @IsArray() fields?: string[];
  @IsOptional() @IsString() @MaxLength(5) lang?: string;
  @IsOptional() @Type(() => Number) @IsNumber() ieltsMax?: number;
  @IsOptional() @Type(() => Number) @IsNumber() gpaMax?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(365) deadlineWithinDays?: number;
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean() noEssay?: boolean;
  @IsOptional() @IsIn(['deadline', 'new', 'popular']) sort?: 'deadline' | 'new' | 'popular';
  @IsOptional() @IsIn(['uz', 'ru', 'en']) locale?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
}

export const FUNDING = ['FULL', 'PARTIAL', 'TUITION', 'LIVING'];
export const LEVELS = ['BACHELOR', 'MASTER', 'PHD', 'POSTDOC', 'SHORT'];

@Injectable()
export class ScholarshipsService {
  constructor(private db: PrismaService) {}

  /** Mijozga qaytariladigan shakl: so'ralgan til, bo'lmasa ingliz tili. */
  present(s: any, locale = 'uz') {
    const tr = s.translations?.find((t: any) => t.locale === locale) ?? s.translations?.find((t: any) => t.locale === 'en') ?? s.translations?.[0];
    const { translations, ...rest } = s;
    return { ...rest, ieltsMin: s.ieltsMin == null ? null : Number(s.ieltsMin), gpaMin: s.gpaMin == null ? null : Number(s.gpaMin), tr };
  }

  async list(q: ListQuery) {
    const locale = q.locale ?? 'uz';
    const now = new Date();
    const and: Prisma.ScholarshipWhereInput[] = [{ status: 'PUBLISHED' }];
    // muddati o'tmaganlar yoki rolling
    and.push({ OR: [{ rolling: true }, { deadline: { gte: now } }] });
    if (q.countries?.length) and.push({ countryCode: { in: q.countries.map((c) => c.toUpperCase()) } });
    if (q.levels?.length) and.push({ levels: { hasSome: q.levels.filter((x) => LEVELS.includes(x)) as any } });
    if (q.funding?.length) and.push({ funding: { in: q.funding.filter((x) => FUNDING.includes(x)) as any } });
    if (q.fields?.length) and.push({ fields: { hasSome: q.fields } });
    if (q.lang) and.push({ languageReq: q.lang });
    if (q.ieltsMax != null) and.push({ OR: [{ ieltsMin: null }, { ieltsMin: { lte: q.ieltsMax } }] });
    if (q.gpaMax != null) and.push({ OR: [{ gpaMin: null }, { gpaMin: { lte: q.gpaMax } }] });
    if (q.noEssay) and.push({ noEssay: true });
    if (q.deadlineWithinDays) and.push({ deadline: { gte: now, lte: new Date(now.getTime() + q.deadlineWithinDays * 864e5) } });
    // Ko'p tilli qidiruv: nom (uz/ru/en), tashkilot, davlat nomi (uz/ru/en) — har bir so'z alohida
    for (const w of (q.q ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 6)) {
      const c = { contains: w, mode: 'insensitive' as const };
      and.push({ OR: [
        { organization: c },
        { translations: { some: { OR: [{ title: c }, { summary: c }] } } },
        { country: { OR: [{ nameUz: c }, { nameRu: c }, { nameEn: c }, { code: c }] } },
      ] });
    }
    const where: Prisma.ScholarshipWhereInput = { AND: and };
    const orderBy: Prisma.ScholarshipOrderByWithRelationInput[] =
      q.sort === 'new' ? [{ publishedAt: 'desc' }] : q.sort === 'popular' ? [{ views: 'desc' }] : [{ deadline: { sort: 'asc', nulls: 'last' } }];
    const page = q.page ?? 1, limit = q.limit ?? 12;
    const [total, rows] = await Promise.all([
      this.db.scholarship.count({ where }),
      this.db.scholarship.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit, include: { translations: true, country: true } }),
    ]);
    return { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)), items: rows.map((r) => this.present(r, locale)) };
  }

  async bySlug(slug: string, locale = 'uz') {
    const s = await this.db.scholarship.findFirst({ where: { slug, status: 'PUBLISHED' }, include: { translations: true, country: true, category: true } });
    if (!s) throw new NotFoundException();
    this.db.scholarship.update({ where: { id: s.id }, data: { views: { increment: 1 } } }).catch(() => undefined);
    this.db.$executeRaw`INSERT INTO "DailyView" ("day", "views") VALUES (CURRENT_DATE, 1) ON CONFLICT ("day") DO UPDATE SET "views" = "DailyView"."views" + 1`.catch(() => undefined);
    return this.present(s, locale);
  }

  async similar(slug: string, locale = 'uz') {
    const s = await this.db.scholarship.findUnique({ where: { slug } });
    if (!s) throw new NotFoundException();
    const rows = await this.db.scholarship.findMany({
      where: { id: { not: s.id }, status: 'PUBLISHED', OR: [{ countryCode: s.countryCode }, { levels: { hasSome: s.levels } }, { fields: { hasSome: s.fields } }] },
      include: { translations: true, country: true }, take: 3, orderBy: { views: 'desc' },
    });
    return rows.map((r) => this.present(r, locale));
  }

  countries() { return this.db.country.findMany({ where: { active: true }, orderBy: { nameEn: 'asc' } }); }

  /** Filtrlar uchun: faqat nashr etilgan dasturi bor davlatlar, kategoriyalar */
  async meta() {
    const [countries, categories, grouped] = await Promise.all([
      this.db.country.findMany({ where: { active: true }, orderBy: { nameEn: 'asc' } }),
      this.db.category.findMany({ orderBy: { nameEn: 'asc' } }),
      this.db.scholarship.groupBy({ by: ['countryCode'], where: { status: 'PUBLISHED' }, _count: true }),
    ]);
    const n = new Map(grouped.map((g) => [g.countryCode, g._count]));
    return { countries: countries.map((c) => ({ ...c, count: n.get(c.code) ?? 0 })), categories };
  }

  /** Faqat tasdiqlangan sharhlar (ism faqat bosh harf bilan) va o'rtacha baho */
  async reviews(slug: string) {
    const s = await this.db.scholarship.findFirst({ where: { slug, status: 'PUBLISHED' }, select: { id: true } });
    if (!s) throw new NotFoundException();
    const rows = await this.db.review.findMany({ where: { scholarshipId: s.id, status: 'APPROVED' }, include: { user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, take: 50 });
    const avg = rows.length ? Math.round((rows.reduce((a, r) => a + r.stars, 0) / rows.length) * 10) / 10 : null;
    return { avg, count: rows.length, items: rows.map((r) => ({ id: r.id, stars: r.stars, text: r.text, author: `${r.user.firstName} ${r.user.lastName.slice(0, 1)}.`, createdAt: r.createdAt })) };
  }
}

export type { ScholarshipStatus };
