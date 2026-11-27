import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OtpPurpose, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.module';
import { MailService } from '../mail/mail.module';
import { RegisterDto } from './dto';

const OTP_TTL_MS = 5 * 60_000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_COOLDOWN_MS = 60_000;
const LOCK_AFTER = 5;
const LOCK_MS = 15 * 60_000;
const ACCESS_TTL_S = 15 * 60;
const REFRESH_TTL_MS = 30 * 24 * 3600_000;
// Foydalanuvchi mavjudligini oshkor qilmaslik uchun soxta hash bilan ham solishtiramiz.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 12);

@Injectable()
export class AuthService {
  constructor(private db: PrismaService, private jwt: JwtService, private mail: MailService) {}

  private norm(email: string) { return email.trim().toLowerCase(); }
  private hmac(email: string, purpose: OtpPurpose, code: string) {
    return createHmac('sha256', process.env.OTP_PEPPER ?? 'dev').update(`${email}|${purpose}|${code}`).digest('hex');
  }

  /** OTP yaratadi (6 xonali), faqat hash saqlanadi; eskilari bekor qilinadi; 60 s kutish. */
  private async issueOtp(email: string, purpose: OtpPurpose, locale: string) {
    const last = await this.db.otpCode.findFirst({ where: { email, purpose }, orderBy: { createdAt: 'desc' } });
    if (last && Date.now() - last.createdAt.getTime() < OTP_COOLDOWN_MS) return; // jim: spamga yo'l qo'ymaydi
    await this.db.otpCode.updateMany({ where: { email, purpose, consumedAt: null }, data: { consumedAt: new Date() } });
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.db.otpCode.create({ data: { email, purpose, codeHash: this.hmac(email, purpose, code), expiresAt: new Date(Date.now() + OTP_TTL_MS) } });
    const sent = await this.mail.sendOtp(email, code, locale);
    if (!sent.ok) { // xat ketmadi: kodni bekor qilamiz, foydalanuvchi darhol qayta urinib ko'ra olsin va aniq xabar ko'rsin
      await this.db.otpCode.deleteMany({ where: { email, purpose, consumedAt: null } });
      throw new HttpException('mail_failed', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  private async checkOtp(email: string, purpose: OtpPurpose, code: string) {
    const rec = await this.db.otpCode.findFirst({ where: { email, purpose, consumedAt: null }, orderBy: { createdAt: 'desc' } });
    if (!rec || rec.expiresAt < new Date()) throw new BadRequestException('otp_expired');
    if (rec.attempts >= OTP_MAX_ATTEMPTS) throw new HttpException('otp_too_many', HttpStatus.TOO_MANY_REQUESTS);
    const a = Buffer.from(rec.codeHash), b = Buffer.from(this.hmac(email, purpose, code));
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      await this.db.otpCode.update({ where: { id: rec.id }, data: { attempts: { increment: 1 } } });
      throw new BadRequestException('otp_wrong');
    }
    await this.db.otpCode.update({ where: { id: rec.id }, data: { consumedAt: new Date() } }); // bir martalik
  }

  /** Ro'yxatdan o'tish: doim STUDENT. Email mavjudligi oshkor qilinmaydi. */
  async register(dto: RegisterDto) {
    const email = this.norm(dto.email);
    const exists = await this.db.user.findUnique({ where: { email } });
    if (!exists) {
      await this.db.user.create({
        data: { email, passwordHash: await bcrypt.hash(dto.password, 12), firstName: dto.firstName.trim(), lastName: dto.lastName.trim(), locale: dto.locale, role: 'STUDENT', profile: { create: {} } },
      });
      await this.issueOtp(email, 'REGISTER', dto.locale);
    } else if (!exists.emailVerifiedAt) {
      await this.issueOtp(email, 'REGISTER', exists.locale); // tasdiqlanmagan hisob: kodni qayta yuborish
    }
    return { ok: true };
  }

  async verifyRegister(emailRaw: string, code: string) {
    const email = this.norm(emailRaw);
    await this.checkOtp(email, 'REGISTER', code);
    const u = await this.db.user.update({ where: { email }, data: { emailVerifiedAt: new Date() } });
    return this.session(u);
  }

  async login(emailRaw: string, password: string, ua?: string) {
    const email = this.norm(emailRaw);
    const u = await this.db.user.findUnique({ where: { email } });
    const ok = await bcrypt.compare(password, u?.passwordHash ?? DUMMY_HASH);
    if (u?.lockedUntil && u.lockedUntil > new Date()) throw new HttpException('locked', HttpStatus.TOO_MANY_REQUESTS);
    if (u && ok && u.emailVerifiedAt && u.blockedAt) throw new UnauthorizedException('account_blocked'); // parol to'g'ri bo'lsa, bloklanganini ochiq aytamiz
    if (!u || !ok || !u.emailVerifiedAt || u.blockedAt) {
      if (u) {
        const n = u.failedLogins + 1;
        await this.db.user.update({ where: { id: u.id }, data: n >= LOCK_AFTER ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MS) } : { failedLogins: n } });
      }
      throw new UnauthorizedException('invalid_credentials'); // bir xil xabar
    }
    await this.db.user.update({ where: { id: u.id }, data: { failedLogins: 0, lockedUntil: null } });
    return this.session(u, ua);
  }

  async requestLoginOtp(emailRaw: string) {
    const email = this.norm(emailRaw);
    const u = await this.db.user.findUnique({ where: { email } });
    if (u && u.emailVerifiedAt && !u.blockedAt) await this.issueOtp(email, 'LOGIN', u.locale);
    return { ok: true };
  }
  async verifyLoginOtp(emailRaw: string, code: string, ua?: string) {
    const email = this.norm(emailRaw);
    const u = await this.db.user.findUnique({ where: { email } });
    if (!u || !u.emailVerifiedAt || u.blockedAt) throw new BadRequestException('otp_expired');
    await this.checkOtp(email, 'LOGIN', code);
    return this.session(u, ua);
  }

  /** "Google/Gmail bilan kirish": parolsiz, faqat emailga kelgan kod. Hisob yo'q bo'lsa yaratiladi (kod tasdiqlangach faollashadi). */
  async requestQuick(emailRaw: string, locale: string) {
    const email = this.norm(emailRaw);
    let u = await this.db.user.findUnique({ where: { email } });
    if (!u) {
      const name = email.split('@')[0].replace(/[^\p{L}\p{M}' .-]/gu, ' ').trim().slice(0, 60) || 'User';
      u = await this.db.user.create({ data: { email, passwordHash: await bcrypt.hash(randomBytes(24).toString('base64url') + 'aA1!', 12), firstName: name, lastName: '', locale, role: 'STUDENT', profile: { create: {} } } });
    }
    if (!u.blockedAt) await this.issueOtp(email, 'LOGIN', u.locale);
    return { ok: true };
  }
  async verifyQuick(emailRaw: string, code: string, ua?: string) {
    const email = this.norm(emailRaw);
    const u = await this.db.user.findUnique({ where: { email } });
    if (!u || u.blockedAt) throw new BadRequestException('otp_expired');
    await this.checkOtp(email, 'LOGIN', code);
    const v = u.emailVerifiedAt ? u : await this.db.user.update({ where: { id: u.id }, data: { emailVerifiedAt: new Date() } });
    return this.session(v, ua);
  }

  async forgot(emailRaw: string) {
    const email = this.norm(emailRaw);
    const u = await this.db.user.findUnique({ where: { email } });
    if (u && u.emailVerifiedAt && !u.blockedAt) await this.issueOtp(email, 'RESET', u.locale);
    return { ok: true }; // mavjud/mavjud emasligidan qat'i nazar bir xil javob
  }
  async reset(emailRaw: string, code: string, newPassword: string) {
    const email = this.norm(emailRaw);
    await this.checkOtp(email, 'RESET', code);
    const u = await this.db.user.update({ where: { email }, data: { passwordHash: await bcrypt.hash(newPassword, 12), failedLogins: 0, lockedUntil: null } });
    await this.db.refreshToken.updateMany({ where: { userId: u.id, revokedAt: null }, data: { revokedAt: new Date() } }); // barcha sessiyalar yopiladi
    return { ok: true };
  }

  // ---- tokenlar ----
  private async session(u: User, ua?: string) {
    this.db.user.update({ where: { id: u.id }, data: { lastActiveAt: new Date() } }).catch(() => undefined);
    if (u.role === 'ADMIN') this.db.auditLog.create({ data: { actorId: u.id, action: 'LOGIN', entity: 'Auth', section: 'auth', userAgent: ua?.slice(0, 200) } }).catch(() => undefined);
    const access = await this.jwt.signAsync({ sub: u.id, role: u.role }, { secret: process.env.JWT_ACCESS_SECRET, expiresIn: ACCESS_TTL_S });
    const refresh = randomBytes(48).toString('base64url');
    await this.db.refreshToken.create({ data: { userId: u.id, tokenHash: createHash('sha256').update(refresh).digest('hex'), expiresAt: new Date(Date.now() + REFRESH_TTL_MS), userAgent: ua?.slice(0, 200) } });
    return { access, refresh, user: this.publicUser(u) };
  }

  /** Refresh token aylantiriladi (rotation): eski bekor qilinadi. Qayta ishlatilgan token — barcha sessiyalar bekor. */
  async refresh(token: string | undefined, ua?: string) {
    if (!token) throw new UnauthorizedException();
    const hash = createHash('sha256').update(token).digest('hex');
    const rec = await this.db.refreshToken.findUnique({ where: { tokenHash: hash }, include: { user: true } });
    if (!rec) throw new UnauthorizedException();
    if (rec.revokedAt) {
      await this.db.refreshToken.updateMany({ where: { userId: rec.userId, revokedAt: null }, data: { revokedAt: new Date() } });
      throw new UnauthorizedException();
    }
    if (rec.expiresAt < new Date() || rec.user.blockedAt) throw new UnauthorizedException();
    await this.db.refreshToken.update({ where: { id: rec.id }, data: { revokedAt: new Date() } });
    return this.session(rec.user, ua);
  }
  async logout(token?: string) {
    if (!token) return;
    await this.db.refreshToken.updateMany({ where: { tokenHash: createHash('sha256').update(token).digest('hex'), revokedAt: null }, data: { revokedAt: new Date() } });
  }

  publicUser(u: User) { return { id: u.id, email: u.email, role: u.role, firstName: u.firstName, lastName: u.lastName, locale: u.locale, avatar: u.avatarKey ? u.avatarKey.split('/').pop() : null }; }
  async me(id: string) {
    const u = await this.db.user.findUnique({ where: { id }, include: { profile: true } });
    if (!u) throw new ForbiddenException();
    return { ...this.publicUser(u), profile: u.profile };
  }
}
