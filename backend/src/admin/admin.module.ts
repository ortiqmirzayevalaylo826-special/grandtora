import { Body, Controller, Get, Header, Module, Param, ParseUUIDPipe, Patch, Post, Put, Query, Req, UseGuards, BadRequestException, Delete, NotFoundException } from '@nestjs/common';
import { FundingType, ReviewStatus, ScholarshipStatus, StudyLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUrl, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { PrismaService } from '../prisma/prisma.module';
import { AuthUser, CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../common/auth';

class TrDto {
  @IsIn(['uz', 'ru', 'en']) locale: string;
  @IsString() @MaxLength(200) title: string;
  @IsString() @MaxLength(400) summary: string;
  @IsOptional() @IsString() @MaxLength(8000) description?: string;
  @IsOptional() @IsString() @MaxLength(4000) eligibility?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) documents?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) process?: string[];
}
class ScholarshipDto {
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/) @MaxLength(120) slug: string;
  @IsString() @MaxLength(160) organization: string;
  @Matches(/^[A-Z]{2}$/) countryCode: string;
  @IsOptional() @IsString() categoryId?: string | null;
  @IsArray() @IsEnum(StudyLevel, { each: true }) levels: StudyLevel[];
  @IsArray() @IsString({ each: true }) fields: string[];
  @IsEnum(FundingType) funding: FundingType;
  @IsOptional() @IsString() @MaxLength(5) languageReq?: string | null;
  @IsOptional() @IsNumber() @Min(0) @Max(9) ieltsMin?: number | null;
  @IsOptional() @IsNumber() @Min(0) @Max(4) gpaMin?: number | null;
  @IsOptional() @IsInt() ageMin?: number | null;
  @IsOptional() @IsInt() ageMax?: number | null;
  @IsOptional() @IsBoolean() noEssay?: boolean;
  @IsOptional() @IsBoolean() rolling?: boolean;
  @IsOptional() @IsDateString() deadline?: string | null;
  @IsUrl({ protocols: ['https', 'http'], require_protocol: true }) officialUrl: string;
  @IsOptional() @IsString() coverImage?: string | null;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() isDemo?: boolean;
  @IsArray() @ValidateNested({ each: true }) @Type(() => TrDto) translations: TrDto[];
}
class CategoryDto {
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/) @MaxLength(60) slug: string;
  @IsString() @MinLength(2) @MaxLength(80) nameUz: string;
  @IsString() @MinLength(2) @MaxLength(80) nameRu: string;
  @IsString() @MinLength(2) @MaxLength(80) nameEn: string;
}
class CountryDto {
  @Matches(/^[A-Z]{2}$/) code: string;
  @IsString() @MinLength(2) @MaxLength(80) nameUz: string;
  @IsString() @MinLength(2) @MaxLength(80) nameRu: string;
  @IsString() @MinLength(2) @MaxLength(80) nameEn: string;
}
class ReviewStatusDto { @IsIn(['APPROVED', 'REJECTED']) status: ReviewStatus }

// Ruxsat etilgan holat o'tishlari
const NEXT: Record<ScholarshipStatus, ScholarshipStatus[]> = {
  DRAFT: ['PENDING', 'PUBLISHED', 'ARCHIVED'],
  PENDING: ['PUBLISHED', 'REJECTED', 'DRAFT'],
  PUBLISHED: ['ARCHIVED', 'EXPIRED', 'DRAFT'],
  REJECTED: ['DRAFT', 'PENDING', 'ARCHIVED'],
  EXPIRED: ['PUBLISHED', 'ARCHIVED'],
  ARCHIVED: ['DRAFT'],
};
class StatusDto { @IsEnum(ScholarshipStatus) status: ScholarshipStatus }
class BulkVerifyDto { @IsArray() @ArrayMaxSize(200) @IsString({ each: true }) ids: string[] }

// CSV injection: =,+,-,@ bilan boshlanadigan katakka ' qo'shiladi
const cell = (v: unknown) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private db: PrismaService) {}

  private audit(actor: string, action: string, entity: string, entityId?: string, meta?: object, ip?: string) {
    return this.db.auditLog.create({ data: { actorId: actor, action, entity, entityId, meta: meta as any, ip } });
  }

  // ---- dasturlar CRUD ----
  @Get('scholarships') list(@Query('status') status?: ScholarshipStatus, @Query('q') q?: string) {
    return this.db.scholarship.findMany({
      where: { ...(status ? { status } : {}), ...(q ? { OR: [{ slug: { contains: q, mode: 'insensitive' } }, { organization: { contains: q, mode: 'insensitive' } }] } : {}) },
      include: { translations: true }, orderBy: { updatedAt: 'desc' }, take: 200,
    });
  }

  @Get('scholarships/:id') async one(@Param('id', ParseUUIDPipe) id: string) {
    const s = await this.db.scholarship.findUnique({ where: { id }, include: { translations: true } });
    if (!s) throw new NotFoundException();
    return s;
  }

  private async checkRefs(d: ScholarshipDto) {
    if (!(await this.db.country.findUnique({ where: { code: d.countryCode } }))) throw new BadRequestException('unknown_country');
    if (d.categoryId && !(await this.db.category.findUnique({ where: { id: d.categoryId } }))) throw new BadRequestException('unknown_category');
    const locales = d.translations.map((t) => t.locale);
    if (new Set(locales).size !== locales.length) throw new BadRequestException('duplicate_locale');
    if (!d.translations.length) throw new BadRequestException('translation_required');
  }

  @Post('scholarships') async create(@CurrentUser() a: AuthUser, @Body() d: ScholarshipDto, @Req() req: any) {
    await this.checkRefs(d);
    if (await this.db.scholarship.findUnique({ where: { slug: d.slug } })) throw new BadRequestException('slug_taken');
    const { translations, deadline, ...rest } = d;
    const s = await this.db.scholarship.create({ data: { ...rest, deadline: deadline ? new Date(deadline) : null, createdById: a.id, status: 'DRAFT', translations: { create: translations } } });
    await this.audit(a.id, 'CREATE', 'Scholarship', s.id, { slug: s.slug }, req.ip);
    return s;
  }

  @Put('scholarships/:id') async update(@CurrentUser() a: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: ScholarshipDto, @Req() req: any) {
    await this.checkRefs(d);
    const cur = await this.db.scholarship.findUnique({ where: { id } });
    if (!cur) throw new NotFoundException();
    const other = await this.db.scholarship.findUnique({ where: { slug: d.slug } });
    if (other && other.id !== id) throw new BadRequestException('slug_taken');
    const { translations, deadline, ...rest } = d;
    const s = await this.db.$transaction(async (tx) => {
      await tx.scholarshipTranslation.deleteMany({ where: { scholarshipId: id } });
      return tx.scholarship.update({ where: { id }, data: { ...rest, deadline: deadline ? new Date(deadline) : null, lastVerifiedAt: new Date(), translations: { create: translations } } });
    });
    await this.audit(a.id, 'UPDATE', 'Scholarship', id, { slug: s.slug }, req.ip);
    return s;
  }

  /** Holat o'tishlari: DRAFT → PENDING → PUBLISHED/REJECTED, PUBLISHED → ARCHIVED/EXPIRED. Nashr — faqat ADMIN. */
  @Patch('scholarships/:id/status') async status(@CurrentUser() a: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: StatusDto, @Req() req: any) {
    const cur = await this.db.scholarship.findUnique({ where: { id }, include: { translations: true } });
    if (!cur) throw new NotFoundException();
    if (cur.status !== d.status && !NEXT[cur.status].includes(d.status)) throw new BadRequestException('bad_transition');
    if (d.status === 'PUBLISHED' && (!cur.translations.length || (!cur.rolling && !cur.deadline))) throw new BadRequestException('incomplete_for_publish');
    const s = await this.db.scholarship.update({ where: { id }, data: { status: d.status, publishedAt: d.status === 'PUBLISHED' ? new Date() : undefined, lastVerifiedAt: d.status === 'PUBLISHED' ? new Date() : undefined } });
    await this.audit(a.id, `STATUS_${d.status}`, 'Scholarship', id, { slug: s.slug }, req.ip);
    return s;
  }

  @Delete('scholarships/:id') async remove(@CurrentUser() a: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const s = await this.db.scholarship.delete({ where: { id } });
    await this.audit(a.id, 'DELETE', 'Scholarship', id, { slug: s.slug }, req.ip);
    return { ok: true };
  }

  // ---- ma'lumot yangiligi (30 kundan eskilar) ----
  @Get('freshness') async freshness() {
    const limit = new Date(Date.now() - 30 * 864e5);
    return this.db.scholarship.findMany({ where: { status: 'PUBLISHED', OR: [{ lastVerifiedAt: null }, { lastVerifiedAt: { lt: limit } }] }, include: { translations: { where: { locale: 'en' } } }, orderBy: { lastVerifiedAt: { sort: 'asc', nulls: 'first' } } });
  }
  @Post('freshness/verify') async verify(@CurrentUser() a: AuthUser, @Body() d: BulkVerifyDto) {
    const r = await this.db.scholarship.updateMany({ where: { id: { in: d.ids } }, data: { lastVerifiedAt: new Date() } });
    await this.audit(a.id, 'BULK_VERIFY', 'Scholarship', undefined, { count: r.count });
    return r;
  }

  // ---- foydalanuvchi xabarlari ----
  @Get('reports') reports() { return this.db.problemReport.findMany({ where: { status: 'OPEN' }, include: { scholarship: { select: { slug: true } } }, orderBy: { createdAt: 'desc' } }); }
  @Patch('reports/:id/resolve') async resolve(@CurrentUser() a: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.audit(a.id, 'REPORT_RESOLVED', 'ProblemReport', id);
    return this.db.problemReport.update({ where: { id }, data: { status: 'RESOLVED' } });
  }

  // ---- foydalanuvchilar ----
  @Get('users') users(@Query('q') q?: string) {
    return this.db.user.findMany({
      where: { role: 'STUDENT', ...(q ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { firstName: { contains: q, mode: 'insensitive' } }, { lastName: { contains: q, mode: 'insensitive' } }] } : {}) },
      select: { id: true, email: true, firstName: true, lastName: true, createdAt: true, blockedAt: true, emailVerifiedAt: true }, orderBy: { createdAt: 'desc' }, take: 200,
    });
  }
  @Patch('users/:id/block') async block(@CurrentUser() a: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body('blocked') blocked: boolean) {
    if (id === a.id) throw new BadRequestException('cannot_block_self');
    const u = await this.db.user.update({ where: { id }, data: { blockedAt: blocked ? new Date() : null } });
    if (blocked) await this.db.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.audit(a.id, blocked ? 'USER_BLOCK' : 'USER_UNBLOCK', 'User', id);
    return { id: u.id, blocked: !!u.blockedAt };
  }

  // ---- statistika va hisobotlar ----
  @Get('stats') async stats() {
    const [users, published, expiring, apps, byStatus, byCountry] = await Promise.all([
      this.db.user.count({ where: { role: 'STUDENT' } }),
      this.db.scholarship.count({ where: { status: 'PUBLISHED' } }),
      this.db.scholarship.count({ where: { status: 'PUBLISHED', deadline: { gte: new Date(), lte: new Date(Date.now() + 7 * 864e5) } } }),
      this.db.application.count(),
      this.db.application.groupBy({ by: ['status'], _count: true }),
      this.db.scholarship.groupBy({ by: ['countryCode'], where: { status: 'PUBLISHED' }, _count: true, orderBy: { _count: { countryCode: 'desc' } }, take: 8 }),
    ]);
    return { users, published, expiring, apps, byStatus, byCountry };
  }

  @Get('export/scholarships.csv') @Header('Content-Type', 'text/csv; charset=utf-8') @Header('Content-Disposition', 'attachment; filename="scholarships.csv"')
  async exportCsv() {
    const rows = await this.db.scholarship.findMany({ include: { translations: { where: { locale: 'en' } } } });
    const head = ['slug', 'title', 'organization', 'country', 'funding', 'status', 'deadline', 'views'];
    return '﻿' + [head.join(','), ...rows.map((r) => [r.slug, r.translations[0]?.title, r.organization, r.countryCode, r.funding, r.status, r.deadline?.toISOString().slice(0, 10), r.views].map(cell).join(','))].join('\n');
  }

  // ---- kategoriyalar ----
  @Get('categories') categories() { return this.db.category.findMany({ orderBy: { nameEn: 'asc' }, include: { _count: { select: { scholarships: true } } } }); }
  @Post('categories') async addCategory(@CurrentUser() a: AuthUser, @Body() d: CategoryDto) {
    if (await this.db.category.findUnique({ where: { slug: d.slug } })) throw new BadRequestException('slug_taken');
    const c = await this.db.category.create({ data: d });
    await this.audit(a.id, 'CREATE', 'Category', c.id, { slug: c.slug });
    return c;
  }
  @Put('categories/:id') async editCategory(@CurrentUser() a: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: CategoryDto) {
    const other = await this.db.category.findUnique({ where: { slug: d.slug } });
    if (other && other.id !== id) throw new BadRequestException('slug_taken');
    await this.audit(a.id, 'UPDATE', 'Category', id);
    return this.db.category.update({ where: { id }, data: d });
  }
  @Delete('categories/:id') async delCategory(@CurrentUser() a: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    if (await this.db.scholarship.count({ where: { categoryId: id } })) throw new BadRequestException('category_in_use');
    await this.db.category.delete({ where: { id } });
    await this.audit(a.id, 'DELETE', 'Category', id);
    return { ok: true };
  }

  // ---- davlatlar ----
  @Get('countries') countries() { return this.db.country.findMany({ orderBy: { nameEn: 'asc' }, include: { _count: { select: { scholarships: true } } } }); }
  @Put('countries') async saveCountry(@CurrentUser() a: AuthUser, @Body() d: CountryDto) {
    const { code, ...names } = d;
    await this.audit(a.id, 'UPSERT', 'Country', code);
    return this.db.country.upsert({ where: { code }, create: d, update: names });
  }
  @Delete('countries/:code') async delCountry(@CurrentUser() a: AuthUser, @Param('code') code: string) {
    if (!/^[A-Z]{2}$/.test(code)) throw new BadRequestException();
    if (await this.db.scholarship.count({ where: { countryCode: code } })) throw new BadRequestException('country_in_use');
    await this.db.country.delete({ where: { code } });
    await this.audit(a.id, 'DELETE', 'Country', code);
    return { ok: true };
  }

  // ---- sharhlar moderatsiyasi ----
  @Get('reviews') reviews(@Query('status') status?: ReviewStatus) {
    return this.db.review.findMany({ where: { status: status ?? 'PENDING' }, include: { scholarship: { select: { slug: true } }, user: { select: { email: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, take: 200 });
  }
  @Patch('reviews/:id') async moderate(@CurrentUser() a: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: ReviewStatusDto) {
    await this.audit(a.id, `REVIEW_${d.status}`, 'Review', id);
    return this.db.review.update({ where: { id }, data: { status: d.status } });
  }

  @Get('audit') audits() { return this.db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }); }
}

@Module({ controllers: [AdminController] })
export class AdminModule {}
