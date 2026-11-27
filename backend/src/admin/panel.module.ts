import { BadRequestException, Body, Controller, Delete, Get, Header, HttpCode, Module, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Prisma, ScholarshipStatus } from '@prisma/client';
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.module';
import { MailService } from '../mail/mail.module';
import { AuthUser, CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../common/auth';

// ---------- yordamchilar ----------
const clamp = (v: unknown, d: number, min: number, max: number) => Math.min(max, Math.max(min, parseInt(String(v ?? ''), 10) || d));
const dir = (v?: string): 'asc' | 'desc' => (v === 'asc' ? 'asc' : 'desc');
const day = (d: Date) => d.toISOString().slice(0, 10);
const csv = (v: unknown) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
const SECTION: Record<string, string> = { Scholarship: 'grants', User: 'users', Review: 'reviews', Ticket: 'tickets', Country: 'catalog', Category: 'catalog', Freshness: 'fresh', Conversation: 'chat', Broadcast: 'chat', Auth: 'auth', Program: 'fresh' };
const sectionOf = (entity: string) => SECTION[entity] ?? 'other';
const NEXT: Record<ScholarshipStatus, ScholarshipStatus[]> = {
  DRAFT: ['PENDING', 'PUBLISHED', 'ARCHIVED'], PENDING: ['PUBLISHED', 'REJECTED', 'DRAFT'], PUBLISHED: ['ARCHIVED', 'EXPIRED', 'DRAFT'],
  REJECTED: ['DRAFT', 'PENDING', 'ARCHIVED'], EXPIRED: ['PUBLISHED', 'ARCHIVED'], ARCHIVED: ['DRAFT'],
};

class BulkGrantsDto {
  @IsArray() @ArrayMaxSize(200) @IsString({ each: true }) ids: string[];
  @IsIn(['status', 'delete']) action: 'status' | 'delete';
  @IsOptional() @IsIn(['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'EXPIRED', 'ARCHIVED']) status?: ScholarshipStatus;
}
class BlockDto { @IsBoolean() blocked: boolean }
class RoleDto { @IsIn(['STUDENT', 'ADMIN']) role: 'STUDENT' | 'ADMIN' }
class DeleteUserDto { @IsString() @MaxLength(254) confirmEmail: string }
class TicketPatchDto {
  @IsOptional() @IsIn(['NEW', 'IN_PROGRESS', 'ANSWERED', 'CLOSED']) stage?: 'NEW' | 'IN_PROGRESS' | 'ANSWERED' | 'CLOSED';
  @IsOptional() @IsIn(['LOW', 'NORMAL', 'HIGH']) priority?: 'LOW' | 'NORMAL' | 'HIGH';
  @IsOptional() @IsString() assigneeId?: string | null;
}
class ReplyDto { @IsString() @MinLength(2) @MaxLength(4000) body: string }
class ReviewDto { @IsIn(['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN']) status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN' }
class FreshDto {
  @IsIn(['UNCHECKED', 'CHECKING', 'VERIFIED', 'REJECTED']) checkStatus: 'UNCHECKED' | 'CHECKING' | 'VERIFIED' | 'REJECTED';
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}
class FreshBulkDto {
  @IsArray() @ArrayMaxSize(200) items: { kind: 'grant' | 'program'; id: string }[];
  @IsIn(['UNCHECKED', 'CHECKING', 'VERIFIED', 'REJECTED']) checkStatus: 'UNCHECKED' | 'CHECKING' | 'VERIFIED' | 'REJECTED';
}
class CountryDto {
  @Matches(/^[A-Z]{2}$/) code: string;
  @IsString() @MinLength(2) @MaxLength(80) nameUz: string;
  @IsString() @MinLength(2) @MaxLength(80) nameRu: string;
  @IsString() @MinLength(2) @MaxLength(80) nameEn: string;
  @IsOptional() @IsString() @MaxLength(1500) infoUz?: string;
  @IsOptional() @IsString() @MaxLength(1500) infoRu?: string;
  @IsOptional() @IsString() @MaxLength(1500) infoEn?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}
class MsgDto { @IsString() @MinLength(1) @MaxLength(4000) body: string }
class StartChatDto { @IsString() studentId: string }
class ArchiveDto { @IsBoolean() archived: boolean }
class BroadcastDto { @IsString() @MinLength(2) @MaxLength(120) title: string; @IsString() @MinLength(2) @MaxLength(2000) body: string }

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/panel')
export class PanelController {
  constructor(private db: PrismaService, private mail: MailService) {}

  private audit(a: AuthUser, action: string, entity: string, entityId: string | undefined, req: any, meta?: object, result = 'OK') {
    return this.db.auditLog.create({ data: { actorId: a.id, action, entity, entityId, meta: meta as any, ip: req?.ip, userAgent: String(req?.headers?.['user-agent'] ?? '').slice(0, 200), result, section: sectionOf(entity) } }).catch(() => undefined);
  }
  private async names(ids: (string | null | undefined)[]) {
    const uniq = [...new Set(ids.filter(Boolean))] as string[];
    const rows = uniq.length ? await this.db.user.findMany({ where: { id: { in: uniq } }, select: { id: true, email: true, firstName: true, lastName: true } }) : [];
    return new Map(rows.map((u) => [u.id, u]));
  }

  // ================= STATISTIKA =================
  @Get('counters') async counters() {
    const [tickets, reviews, grants, chats] = await Promise.all([
      this.db.contactMessage.count({ where: { stage: 'NEW' } }),
      this.db.review.count({ where: { status: 'PENDING' } }),
      this.db.scholarship.count({ where: { status: 'PENDING' } }),
      this.db.chatMessage.count({ where: { fromAdmin: false, readAt: null, conversation: { archived: false } } }),
    ]);
    return { tickets, reviews, grants, chats };
  }

  @Get('dashboard') async dashboard(@Query('days') daysQ?: string) {
    const days = clamp(daysQ, 30, 7, 365);
    const since = new Date(Date.now() - days * 864e5);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const now = new Date();
    const [total, active, users, todayReg, pending, newTickets, blocked] = await Promise.all([
      this.db.scholarship.count(),
      this.db.scholarship.count({ where: { status: 'PUBLISHED', OR: [{ rolling: true }, { deadline: null }, { deadline: { gte: now } }] } }),
      this.db.user.count(),
      this.db.user.count({ where: { createdAt: { gte: today } } }),
      this.db.scholarship.count({ where: { status: 'PENDING' } }),
      this.db.contactMessage.count({ where: { stage: 'NEW' } }),
      this.db.user.count({ where: { blockedAt: { not: null } } }),
    ]);
    const regRows = await this.db.$queryRaw<{ d: Date; n: number }[]>`SELECT date_trunc('day', "createdAt") AS d, count(*)::int AS n FROM "User" WHERE "createdAt" >= ${since} GROUP BY 1 ORDER BY 1`;
    const viewRows = await this.db.dailyView.findMany({ where: { day: { gte: since } }, orderBy: { day: 'asc' } });
    const regMap = new Map(regRows.map((r) => [day(new Date(r.d)), Number(r.n)]));
    const viewMap = new Map(viewRows.map((r) => [day(r.day), r.views]));
    const series = (m: Map<string, number>) => Array.from({ length: days + 1 }, (_, i) => { const k = day(new Date(since.getTime() + i * 864e5)); return { day: k, n: m.get(k) ?? 0 }; });
    const byCountryRaw = await this.db.scholarship.groupBy({ by: ['countryCode'], where: { status: 'PUBLISHED' }, _count: true, orderBy: { _count: { countryCode: 'desc' } }, take: 8 });
    const countries = await this.db.country.findMany({ where: { code: { in: byCountryRaw.map((c) => c.countryCode) } } });
    const byCountry = byCountryRaw.map((c) => { const k = countries.find((x) => x.code === c.countryCode); return { code: c.countryCode, nameUz: k?.nameUz ?? c.countryCode, nameRu: k?.nameRu ?? c.countryCode, nameEn: k?.nameEn ?? c.countryCode, n: c._count }; });
    const byLevel = await this.db.$queryRaw<{ level: string; n: number }[]>`SELECT l::text AS level, count(*)::int AS n FROM "Scholarship", unnest("levels") AS l WHERE "status" = 'PUBLISHED' GROUP BY 1 ORDER BY 2 DESC`;
    const audits = await this.db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8 });
    const nm = await this.names(audits.map((x) => x.actorId));
    const pick = (r: any) => ({ id: r.id, slug: r.slug, organization: r.organization, countryCode: r.countryCode, views: r.views, createdAt: r.createdAt, title: (r.translations.find((t: any) => t.locale === 'en') ?? r.translations[0])?.title ?? r.slug });
    const [newGrants, popular] = await Promise.all([
      this.db.scholarship.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { translations: true } }),
      this.db.scholarship.findMany({ where: { status: 'PUBLISHED' }, orderBy: { views: 'desc' }, take: 5, include: { translations: true } }),
    ]);
    const viewsTotal = viewRows.reduce((a, r) => a + r.views, 0);
    return {
      days, cards: { total, active, users, todayReg, pending, newTickets, blocked },
      registrations: series(regMap), views: series(viewMap), viewsTotal, byCountry, byLevel,
      recent: audits.map((x) => ({ id: x.id, action: x.action, entity: x.entity, meta: x.meta, createdAt: x.createdAt, actor: nm.get(x.actorId ?? '')?.email ?? null })),
      newGrants: newGrants.map(pick), popular: popular.map(pick),
    };
  }

  // ================= GRANTLAR =================
  @Get('grants') async grants(@Query() q: any) {
    const page = clamp(q.page, 1, 1, 100000), limit = clamp(q.limit, 10, 5, 100);
    const where: Prisma.ScholarshipWhereInput = {
      ...(q.status ? { status: q.status } : {}), ...(q.country ? { countryCode: String(q.country) } : {}), ...(q.level ? { levels: { has: q.level } } : {}), ...(q.funding ? { funding: q.funding } : {}),
      ...(q.q ? { OR: [{ slug: { contains: String(q.q), mode: 'insensitive' } }, { organization: { contains: String(q.q), mode: 'insensitive' } }, { translations: { some: { title: { contains: String(q.q), mode: 'insensitive' } } } }] } : {}),
    };
    const sortKey = ['updatedAt', 'deadline', 'views', 'status', 'organization', 'createdAt'].includes(q.sort) ? q.sort : 'updatedAt';
    const [total, rows] = await Promise.all([
      this.db.scholarship.count({ where }),
      this.db.scholarship.findMany({ where, include: { translations: true, country: true }, orderBy: { [sortKey]: dir(q.dir) } as any, skip: (page - 1) * limit, take: limit }),
    ]);
    return {
      total, page, limit, pages: Math.max(1, Math.ceil(total / limit)),
      items: rows.map((r) => ({ id: r.id, slug: r.slug, title: (r.translations.find((t) => t.locale === 'en') ?? r.translations[0])?.title ?? r.slug, organization: r.organization, countryCode: r.countryCode, country: r.country, levels: r.levels, funding: r.funding, deadline: r.deadline, rolling: r.rolling, status: r.status, views: r.views, isDemo: r.isDemo, updatedAt: r.updatedAt })),
    };
  }

  @Post('grants/bulk') @HttpCode(200) async bulkGrants(@CurrentUser() a: AuthUser, @Body() d: BulkGrantsDto, @Req() req: any) {
    if (d.action === 'delete') {
      const r = await this.db.scholarship.deleteMany({ where: { id: { in: d.ids } } });
      await this.audit(a, 'BULK_DELETE', 'Scholarship', undefined, req, { count: r.count });
      return { done: r.count, skipped: d.ids.length - r.count };
    }
    if (!d.status) throw new BadRequestException('status_required');
    const rows = await this.db.scholarship.findMany({ where: { id: { in: d.ids } }, include: { translations: true } });
    let done = 0, skipped = 0;
    for (const s of rows) {
      const ok = s.status === d.status || NEXT[s.status].includes(d.status) ;
      const complete = d.status !== 'PUBLISHED' || (s.translations.length > 0 && (s.rolling || !!s.deadline));
      if (!ok || !complete) { skipped++; continue; }
      await this.db.scholarship.update({ where: { id: s.id }, data: { status: d.status, publishedAt: d.status === 'PUBLISHED' ? new Date() : undefined, lastVerifiedAt: d.status === 'PUBLISHED' ? new Date() : undefined } });
      done++;
    }
    await this.audit(a, `BULK_STATUS_${d.status}`, 'Scholarship', undefined, req, { done, skipped });
    return { done, skipped };
  }

  // ================= FOYDALANUVCHILAR =================
  @Get('users') async users(@Query() q: any) {
    const page = clamp(q.page, 1, 1, 100000), limit = clamp(q.limit, 10, 5, 100);
    const where: Prisma.UserWhereInput = {
      ...(q.role === 'ADMIN' || q.role === 'STUDENT' ? { role: q.role } : {}),
      ...(q.status === 'blocked' ? { blockedAt: { not: null } } : q.status === 'active' ? { blockedAt: null, emailVerifiedAt: { not: null } } : q.status === 'unverified' ? { emailVerifiedAt: null } : {}),
      ...(q.q ? { OR: [{ email: { contains: String(q.q), mode: 'insensitive' } }, { firstName: { contains: String(q.q), mode: 'insensitive' } }, { lastName: { contains: String(q.q), mode: 'insensitive' } }] } : {}),
    };
    const sortKey = ['createdAt', 'lastActiveAt', 'firstName', 'email', 'role'].includes(q.sort) ? q.sort : 'createdAt';
    const [total, rows] = await Promise.all([
      this.db.user.count({ where }),
      this.db.user.findMany({ where, orderBy: { [sortKey]: dir(q.dir) } as any, skip: (page - 1) * limit, take: limit, select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true, lastActiveAt: true, blockedAt: true, emailVerifiedAt: true } }),
    ]);
    return { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)), items: rows };
  }

  @Get('users/:id') async user(@Param('id', ParseUUIDPipe) id: string) {
    const u = await this.db.user.findUnique({ where: { id }, include: { profile: true } });
    if (!u) throw new NotFoundException();
    const [saved, apps, activity, sessions, reviews] = await Promise.all([
      this.db.savedScholarship.findMany({ where: { userId: id }, include: { scholarship: { include: { translations: true } } }, orderBy: { createdAt: 'desc' }, take: 20 }),
      this.db.application.findMany({ where: { userId: id }, include: { scholarship: { include: { translations: true } } }, orderBy: { updatedAt: 'desc' }, take: 20 }),
      this.db.auditLog.findMany({ where: { OR: [{ actorId: id }, { entityId: id }] }, orderBy: { createdAt: 'desc' }, take: 20 }),
      this.db.refreshToken.count({ where: { userId: id, revokedAt: null, expiresAt: { gt: new Date() } } }),
      this.db.review.count({ where: { userId: id } }),
    ]);
    const t = (s: any) => (s.translations.find((x: any) => x.locale === 'en') ?? s.translations[0])?.title ?? s.slug;
    return {
      user: { id: u.id, email: u.email, role: u.role, firstName: u.firstName, lastName: u.lastName, locale: u.locale, createdAt: u.createdAt, lastActiveAt: u.lastActiveAt, blockedAt: u.blockedAt, emailVerifiedAt: u.emailVerifiedAt },
      profile: u.profile, sessions, reviews,
      saved: saved.map((x: any) => ({ id: x.scholarshipId, slug: x.scholarship.slug, title: t(x.scholarship) })),
      applications: apps.map((x: any) => ({ id: x.id, slug: x.scholarship.slug, title: t(x.scholarship), status: x.status, updatedAt: x.updatedAt })),
      activity: activity.map((x) => ({ id: x.id, action: x.action, entity: x.entity, createdAt: x.createdAt })),
    };
  }

  @Patch('users/:id/block') async block(@CurrentUser() a: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: BlockDto, @Req() req: any) {
    if (id === a.id) throw new BadRequestException('cannot_block_self');
    const u = await this.db.user.update({ where: { id }, data: { blockedAt: d.blocked ? new Date() : null } });
    if (d.blocked) await this.db.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.audit(a, d.blocked ? 'USER_BLOCK' : 'USER_UNBLOCK', 'User', id, req, { email: u.email });
    return { id, blocked: !!u.blockedAt };
  }
  @Patch('users/:id/role') async role(@CurrentUser() a: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: RoleDto, @Req() req: any) {
    if (id === a.id) throw new BadRequestException('cannot_change_self');
    const u = await this.db.user.update({ where: { id }, data: { role: d.role } });
    await this.audit(a, 'USER_ROLE', 'User', id, req, { email: u.email, role: d.role });
    return { id, role: u.role };
  }
  /** Hisobni o'chirish: serverda ham emailni qayta yozib tasdiqlash talab qilinadi. */
  @Delete('users/:id') async remove(@CurrentUser() a: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: DeleteUserDto, @Req() req: any) {
    if (id === a.id) throw new BadRequestException('cannot_delete_self');
    const u = await this.db.user.findUnique({ where: { id } });
    if (!u) throw new NotFoundException();
    if (u.role === 'ADMIN') throw new BadRequestException('cannot_delete_admin');
    if (d.confirmEmail.trim().toLowerCase() !== u.email) throw new BadRequestException('confirm_mismatch');
    await this.db.user.delete({ where: { id } });
    await this.audit(a, 'USER_DELETE', 'User', id, req, { email: u.email });
    return { ok: true };
  }

  // ================= MUROJAATLAR (aloqa formasi) =================
  @Get('admins') async admins() { return this.db.user.findMany({ where: { role: 'ADMIN', blockedAt: null }, select: { id: true, firstName: true, lastName: true, email: true } }); }

  @Get('tickets') async tickets(@Query() q: any) {
    const page = clamp(q.page, 1, 1, 100000), limit = clamp(q.limit, 10, 5, 100);
    const where: Prisma.ContactMessageWhereInput = {
      ...(q.stage ? { stage: q.stage } : {}), ...(q.priority ? { priority: q.priority } : {}), ...(q.category ? { category: String(q.category) } : {}),
      ...(q.q ? { OR: [{ subject: { contains: String(q.q), mode: 'insensitive' } }, { name: { contains: String(q.q), mode: 'insensitive' } }, { email: { contains: String(q.q), mode: 'insensitive' } }] } : {}),
    };
    const sortKey = ['createdAt', 'priority', 'stage', 'num'].includes(q.sort) ? q.sort : 'createdAt';
    const [total, rows, counts] = await Promise.all([
      this.db.contactMessage.count({ where }),
      this.db.contactMessage.findMany({ where, orderBy: { [sortKey]: dir(q.dir) } as any, skip: (page - 1) * limit, take: limit, include: { _count: { select: { replies: true } } } }),
      this.db.contactMessage.groupBy({ by: ['stage'], _count: true }),
    ]);
    const nm = await this.names(rows.map((r) => r.assigneeId));
    return {
      total, page, limit, pages: Math.max(1, Math.ceil(total / limit)), counts: Object.fromEntries(counts.map((c) => [c.stage, c._count])),
      items: rows.map((r) => ({ id: r.id, num: r.num, name: r.name, email: r.email, subject: r.subject, category: r.category, priority: r.priority, stage: r.stage, createdAt: r.createdAt, replies: r._count.replies, assignee: r.assigneeId ? `${nm.get(r.assigneeId)?.firstName ?? ''} ${nm.get(r.assigneeId)?.lastName ?? ''}`.trim() || nm.get(r.assigneeId)?.email : null })),
    };
  }
  @Get('tickets/:id') async ticket(@Param('id', ParseUUIDPipe) id: string) {
    const t = await this.db.contactMessage.findUnique({ where: { id }, include: { replies: { orderBy: { createdAt: 'asc' } } } });
    if (!t) throw new NotFoundException();
    const nm = await this.names([t.assigneeId, ...t.replies.map((r) => r.authorId)]);
    const who = (i?: string | null) => (i ? `${nm.get(i)?.firstName ?? ''} ${nm.get(i)?.lastName ?? ''}`.trim() || nm.get(i)?.email || '' : '');
    return { ...t, assigneeName: who(t.assigneeId), replies: t.replies.map((r) => ({ ...r, authorName: who(r.authorId) })) };
  }
  @Patch('tickets/:id') async patchTicket(@CurrentUser() a: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: TicketPatchDto, @Req() req: any) {
    if (!(await this.db.contactMessage.findUnique({ where: { id } }))) throw new NotFoundException();
    if (d.assigneeId) { const ad = await this.db.user.findFirst({ where: { id: d.assigneeId, role: 'ADMIN' } }); if (!ad) throw new BadRequestException('bad_assignee'); }
    const data: Prisma.ContactMessageUpdateInput = {};
    if (d.stage) { data.stage = d.stage; data.status = d.stage === 'CLOSED' || d.stage === 'ANSWERED' ? 'RESOLVED' : 'OPEN'; }
    if (d.priority) data.priority = d.priority;
    if (d.assigneeId !== undefined) data.assigneeId = d.assigneeId || null;
    const r = await this.db.contactMessage.update({ where: { id }, data });
    await this.audit(a, 'TICKET_UPDATE', 'Ticket', id, req, d as object);
    return r;
  }
  @Post('tickets/:id/reply') @HttpCode(200) async reply(@CurrentUser() a: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: ReplyDto, @Req() req: any) {
    const t = await this.db.contactMessage.findUnique({ where: { id } });
    if (!t) throw new NotFoundException();
    const r = await this.db.contactMessage.update({ where: { id }, data: { stage: 'ANSWERED', status: 'RESOLVED', assigneeId: t.assigneeId ?? a.id, replies: { create: { authorId: a.id, body: d.body.trim() } } } });
    await this.mail.sendPlain(t.email, `Re: ${t.subject}`, d.body.trim());
    await this.audit(a, 'TICKET_REPLY', 'Ticket', id, req, { to: t.email });
    return { ok: true, stage: r.stage };
  }

  // ================= SHARHLAR =================
  @Get('reviews') async reviews(@Query() q: any) {
    const page = clamp(q.page, 1, 1, 100000), limit = clamp(q.limit, 10, 5, 100);
    const where: Prisma.ReviewWhereInput = {
      ...(q.status ? { status: q.status } : {}), ...(q.stars ? { stars: clamp(q.stars, 5, 1, 5) } : {}),
      ...(q.q ? { OR: [{ text: { contains: String(q.q), mode: 'insensitive' } }, { user: { email: { contains: String(q.q), mode: 'insensitive' } } }, { scholarship: { slug: { contains: String(q.q), mode: 'insensitive' } } }] } : {}),
    };
    const [total, rows, counts] = await Promise.all([
      this.db.review.count({ where }),
      this.db.review.findMany({ where, orderBy: { createdAt: dir(q.dir) }, skip: (page - 1) * limit, take: limit, include: { user: { select: { firstName: true, lastName: true, email: true } }, scholarship: { select: { slug: true, translations: true } } } }),
      this.db.review.groupBy({ by: ['status'], _count: true }),
    ]);
    return {
      total, page, limit, pages: Math.max(1, Math.ceil(total / limit)), counts: Object.fromEntries(counts.map((c) => [c.status, c._count])),
      items: rows.map((r) => ({ id: r.id, stars: r.stars, text: r.text, status: r.status, createdAt: r.createdAt, user: `${r.user.firstName} ${r.user.lastName}`.trim(), email: r.user.email, slug: r.scholarship.slug, grant: (r.scholarship.translations.find((t) => t.locale === 'en') ?? r.scholarship.translations[0])?.title ?? r.scholarship.slug })),
    };
  }
  @Patch('reviews/:id') async setReview(@CurrentUser() a: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: ReviewDto, @Req() req: any) {
    const r = await this.db.review.update({ where: { id }, data: { status: d.status } }).catch(() => { throw new NotFoundException(); });
    await this.audit(a, `REVIEW_${d.status}`, 'Review', id, req);
    return r;
  }
  @Delete('reviews/:id') async delReview(@CurrentUser() a: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    await this.db.review.delete({ where: { id } }).catch(() => { throw new NotFoundException(); });
    await this.audit(a, 'REVIEW_DELETE', 'Review', id, req);
    return { ok: true };
  }

  // ================= YANGILIK TEKSHIRUVI =================
  /** Ma'lumot yangiligi: holat qo'lda belgilanadi. Muddati o'tgan bo'lsa "EXPIRED" ko'rsatiladi. Hech narsa avtomatik tasdiqlanmaydi. */
  @Get('fresh') async fresh(@Query() q: any) {
    const now = new Date();
    const [g0, p0] = await Promise.all([
      q.kind === 'program' ? [] : this.db.scholarship.findMany({ where: { status: { in: ['PUBLISHED', 'PENDING', 'EXPIRED'] } }, include: { translations: true }, orderBy: { updatedAt: 'desc' }, take: 500 }),
      q.kind === 'grant' ? [] : this.db.program.findMany({ where: { published: true }, orderBy: { updatedAt: 'desc' }, take: 200 }),
    ]);
    const g = g0 as any[], p = p0 as any[];
    const title = (s: any) => (s.translations.find((x: any) => x.locale === 'en') ?? s.translations[0])?.title ?? s.slug;
    let items = [
      ...g.map((s: any) => ({ kind: 'grant' as const, id: s.id, slug: s.slug, title: title(s), organization: s.organization, url: s.officialUrl, deadline: s.deadline, lastVerifiedAt: s.lastVerifiedAt, checkStatus: s.checkStatus, note: s.checkNote })),
      ...p.map((s: any) => ({ kind: 'program' as const, id: s.id, slug: s.slug, title: (s.i18n?.en?.title ?? s.i18n?.uz?.title ?? s.slug) as string, organization: s.organization, url: s.officialUrl, deadline: null as Date | null, lastVerifiedAt: s.checkedAt, checkStatus: s.checkStatus, note: s.checkNote })),
    ].map((x) => ({ ...x, state: x.deadline && new Date(x.deadline) < now && x.checkStatus !== 'VERIFIED' ? 'EXPIRED' : x.checkStatus }));
    const counts: Record<string, number> = {};
    for (const x of items) counts[x.state] = (counts[x.state] ?? 0) + 1;
    if (q.state) items = items.filter((x) => x.state === q.state);
    if (q.q) { const s = String(q.q).toLowerCase(); items = items.filter((x) => x.title.toLowerCase().includes(s) || x.organization.toLowerCase().includes(s) || x.url.toLowerCase().includes(s)); }
    return { counts, total: items.length, items: items.slice(0, 300) };
  }
  private async setFresh(kind: 'grant' | 'program', id: string, st: FreshDto['checkStatus'], note?: string) {
    const data = { checkStatus: st, checkNote: note ?? undefined };
    if (kind === 'grant') return this.db.scholarship.update({ where: { id }, data: { ...data, ...(st === 'VERIFIED' ? { lastVerifiedAt: new Date() } : {}) } });
    return this.db.program.update({ where: { id }, data: { ...data, checkedAt: st === 'VERIFIED' ? new Date() : undefined } });
  }
  @Patch('fresh/:kind/:id') async patchFresh(@CurrentUser() a: AuthUser, @Param('kind') kind: string, @Param('id', ParseUUIDPipe) id: string, @Body() d: FreshDto, @Req() req: any) {
    if (kind !== 'grant' && kind !== 'program') throw new BadRequestException();
    await this.setFresh(kind, id, d.checkStatus, d.note).catch(() => { throw new NotFoundException(); });
    await this.audit(a, `FRESH_${d.checkStatus}`, 'Freshness', id, req, { kind, note: d.note });
    return { ok: true };
  }
  @Post('fresh/bulk') @HttpCode(200) async bulkFresh(@CurrentUser() a: AuthUser, @Body() d: FreshBulkDto, @Req() req: any) {
    let n = 0;
    for (const it of d.items) if ((it.kind === 'grant' || it.kind === 'program') && /^[0-9a-f-]{36}$/.test(it.id)) { await this.setFresh(it.kind, it.id, d.checkStatus).then(() => n++).catch(() => undefined); }
    await this.audit(a, `FRESH_BULK_${d.checkStatus}`, 'Freshness', undefined, req, { count: n });
    return { done: n };
  }

  // ================= DAVLAT, KATEGORIYA, BOSQICHLAR =================
  @Get('countries') async countries() {
    const [rows, g] = await Promise.all([this.db.country.findMany({ orderBy: { nameEn: 'asc' } }), this.db.scholarship.groupBy({ by: ['countryCode'], _count: true })]);
    const n = new Map(g.map((x) => [x.countryCode, x._count]));
    return rows.map((c) => ({ code: c.code, nameUz: c.nameUz, nameRu: c.nameRu, nameEn: c.nameEn, infoUz: c.infoUz, infoRu: c.infoRu, infoEn: c.infoEn, active: c.active, grants: n.get(c.code) ?? 0 }));
  }
  @Put('countries') async saveCountry(@CurrentUser() a: AuthUser, @Body() d: CountryDto, @Req() req: any) {
    const { code, ...data } = d;
    const r = await this.db.country.upsert({ where: { code }, create: { code, ...data }, update: data });
    await this.audit(a, 'UPSERT', 'Country', code, req);
    return r;
  }
  @Patch('countries/:code/active') async countryActive(@CurrentUser() a: AuthUser, @Param('code') code: string, @Body() d: { active: boolean }, @Req() req: any) {
    if (!/^[A-Z]{2}$/.test(code)) throw new BadRequestException();
    const r = await this.db.country.update({ where: { code }, data: { active: !!d.active } }).catch(() => { throw new NotFoundException(); });
    await this.audit(a, d.active ? 'ACTIVATE' : 'DEACTIVATE', 'Country', code, req);
    return { code, active: r.active };
  }
  @Get('levels') async levels() {
    const rows = await this.db.$queryRaw<{ level: string; n: number }[]>`SELECT l::text AS level, count(*)::int AS n FROM "Scholarship", unnest("levels") AS l GROUP BY 1`;
    const m = new Map(rows.map((r) => [r.level, Number(r.n)]));
    return ['BACHELOR', 'MASTER', 'PHD', 'POSTDOC', 'SHORT'].map((l) => ({ level: l, n: m.get(l) ?? 0 }));
  }

  // ================= AUDIT JURNALI =================
  private auditWhere(q: any): Prisma.AuditLogWhereInput {
    const entities = q.section ? Object.entries(SECTION).filter(([, v]) => v === q.section).map(([k]) => k) : [];
    return {
      ...(q.from || q.to ? { createdAt: { ...(q.from ? { gte: new Date(String(q.from)) } : {}), ...(q.to ? { lte: new Date(`${String(q.to)}T23:59:59.999Z`) } : {}) } } : {}),
      ...(q.actor ? { actorId: String(q.actor) } : {}), ...(q.action ? { action: { contains: String(q.action), mode: 'insensitive' } } : {}),
      ...(q.section ? { OR: [{ section: String(q.section) }, { entity: { in: entities } }] } : {}), ...(q.result ? { result: String(q.result) } : {}),
    };
  }
  @Get('audit') async audits(@Query() q: any) {
    const page = clamp(q.page, 1, 1, 100000), limit = clamp(q.limit, 20, 5, 100);
    const where = this.auditWhere(q);
    const [total, rows] = await Promise.all([this.db.auditLog.count({ where }), this.db.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit })]);
    const nm = await this.names(rows.map((r) => r.actorId));
    return { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)), items: rows.map((r) => ({ id: r.id, createdAt: r.createdAt, actor: nm.get(r.actorId ?? '')?.email ?? null, action: r.action, section: r.section ?? sectionOf(r.entity), entity: r.entity, entityId: r.entityId, ip: r.ip, userAgent: r.userAgent, result: r.result })) };
  }
  @Get('audit/export.csv') @Header('Content-Type', 'text/csv; charset=utf-8') @Header('Content-Disposition', 'attachment; filename="audit.csv"')
  async auditCsv(@CurrentUser() a: AuthUser, @Query() q: any, @Req() req: any) {
    const rows = await this.db.auditLog.findMany({ where: this.auditWhere(q), orderBy: { createdAt: 'desc' }, take: 5000 });
    const nm = await this.names(rows.map((r) => r.actorId));
    await this.audit(a, 'AUDIT_EXPORT', 'Auth', undefined, req, { rows: rows.length });
    const head = ['time', 'admin', 'action', 'section', 'object', 'ip', 'browser', 'result'];
    return '﻿' + [head.join(','), ...rows.map((r) => [r.createdAt.toISOString(), nm.get(r.actorId ?? '')?.email, r.action, r.section ?? sectionOf(r.entity), `${r.entity}${r.entityId ? ':' + r.entityId : ''}`, r.ip, r.userAgent, r.result].map(csv).join(','))].join('\n');
  }

  // ================= XABARLAR (admin ↔ talaba) =================
  @Get('chat/conversations') async conversations(@Query() q: any) {
    const where: Prisma.ConversationWhereInput = {
      archived: q.archived === 'true',
      ...(q.q ? { student: { OR: [{ email: { contains: String(q.q), mode: 'insensitive' } }, { firstName: { contains: String(q.q), mode: 'insensitive' } }, { lastName: { contains: String(q.q), mode: 'insensitive' } }] } } : {}),
    };
    const rows = await this.db.conversation.findMany({ where, orderBy: { lastMessageAt: 'desc' }, take: 100, include: { student: { select: { id: true, firstName: true, lastName: true, email: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } } });
    const unread = await this.db.chatMessage.groupBy({ by: ['conversationId'], where: { fromAdmin: false, readAt: null, conversationId: { in: rows.map((r) => r.id) } }, _count: true });
    const u = new Map(unread.map((x) => [x.conversationId, x._count]));
    let items = rows.map((r) => ({ id: r.id, student: r.student, archived: r.archived, lastMessageAt: r.lastMessageAt, last: r.messages[0]?.body ?? '', lastFromAdmin: r.messages[0]?.fromAdmin ?? false, unread: u.get(r.id) ?? 0 }));
    if (q.filter === 'unread') items = items.filter((x) => x.unread > 0);
    return items;
  }
  @Get('chat/conversations/:id') async conversation(@Param('id', ParseUUIDPipe) id: string) {
    const c = await this.db.conversation.findUnique({ where: { id }, include: { student: { select: { id: true, firstName: true, lastName: true, email: true } }, messages: { orderBy: { createdAt: 'asc' }, take: 300 } } });
    if (!c) throw new NotFoundException();
    await this.db.chatMessage.updateMany({ where: { conversationId: id, fromAdmin: false, readAt: null }, data: { readAt: new Date() } });
    return c;
  }
  @Post('chat/conversations/:id/messages') @HttpCode(200) async send(@CurrentUser() a: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: MsgDto) {
    if (!(await this.db.conversation.findUnique({ where: { id } }))) throw new NotFoundException();
    const m = await this.db.chatMessage.create({ data: { conversationId: id, senderId: a.id, fromAdmin: true, body: d.body.trim() } });
    await this.db.conversation.update({ where: { id }, data: { lastMessageAt: new Date(), archived: false } });
    return m;
  }
  @Patch('chat/conversations/:id') async archive(@CurrentUser() a: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: ArchiveDto, @Req() req: any) {
    const c = await this.db.conversation.update({ where: { id }, data: { archived: d.archived } }).catch(() => { throw new NotFoundException(); });
    await this.audit(a, d.archived ? 'CHAT_ARCHIVE' : 'CHAT_RESTORE', 'Conversation', id, req);
    return { id, archived: c.archived };
  }
  @Post('chat/start') @HttpCode(200) async start(@Body() d: StartChatDto) {
    const u = await this.db.user.findFirst({ where: { id: d.studentId, role: 'STUDENT' } });
    if (!u) throw new NotFoundException();
    const c = await this.db.conversation.upsert({ where: { studentId: u.id }, create: { studentId: u.id }, update: { archived: false } });
    return { id: c.id };
  }
  /** Umumiy e'lon: barcha faol talabalarga bildirishnoma (kabinetdagi "Bildirishnomalar" bo'limida ko'rinadi). */
  @Post('chat/broadcast') @Throttle({ default: { limit: 3, ttl: 60_000 } }) @HttpCode(200)
  async broadcast(@CurrentUser() a: AuthUser, @Body() d: BroadcastDto, @Req() req: any) {
    const students = await this.db.user.findMany({ where: { role: 'STUDENT', blockedAt: null, emailVerifiedAt: { not: null } }, select: { id: true } });
    const stamp = Date.now();
    await this.db.notification.createMany({ data: students.map((s) => ({ userId: s.id, type: 'ADMIN_MESSAGE' as const, dedupeKey: `bc:${stamp}:${s.id}`, payload: { title: d.title.trim(), body: d.body.trim() } })) });
    await this.audit(a, 'BROADCAST', 'Broadcast', undefined, req, { title: d.title, recipients: students.length });
    return { recipients: students.length };
  }
}

/** Talaba tomoni: o'z suhbati */
@UseGuards(JwtAuthGuard)
@Controller('me/chat')
export class StudentChatController {
  constructor(private db: PrismaService) {}

  @Get() async mine(@CurrentUser() u: AuthUser) {
    const c = await this.db.conversation.findUnique({ where: { studentId: u.id }, include: { messages: { orderBy: { createdAt: 'asc' }, take: 300 } } });
    if (!c) return { messages: [], unread: 0 };
    await this.db.chatMessage.updateMany({ where: { conversationId: c.id, fromAdmin: true, readAt: null }, data: { readAt: new Date() } });
    return { messages: c.messages, unread: 0 };
  }
  @Get('unread') async unread(@CurrentUser() u: AuthUser) {
    return { unread: await this.db.chatMessage.count({ where: { fromAdmin: true, readAt: null, conversation: { studentId: u.id } } }) };
  }
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post() @HttpCode(200) async send(@CurrentUser() u: AuthUser, @Body() d: MsgDto) {
    if (u.role !== 'STUDENT') throw new BadRequestException('students_only');
    const c = await this.db.conversation.upsert({ where: { studentId: u.id }, create: { studentId: u.id }, update: { archived: false } });
    const m = await this.db.chatMessage.create({ data: { conversationId: c.id, senderId: u.id, fromAdmin: false, body: d.body.trim() } });
    await this.db.conversation.update({ where: { id: c.id }, data: { lastMessageAt: new Date() } });
    return m;
  }
}

@Module({ controllers: [PanelController, StudentChatController] })
export class PanelModule {}
