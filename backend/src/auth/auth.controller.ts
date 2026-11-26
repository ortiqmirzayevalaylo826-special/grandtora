import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { EmailDto, LoginDto, RegisterDto, ResetDto, VerifyDto } from './dto';
import { AuthUser, CurrentUser, JwtAuthGuard } from '../common/auth';

const secure = () => process.env.COOKIE_SECURE === 'true';
const opts = (maxAge: number, path = '/') => ({ httpOnly: true, sameSite: 'lax' as const, secure: secure(), maxAge, path });

function setSession(res: Response, s: { access: string; refresh: string }) {
  res.cookie('at', s.access, opts(15 * 60_000));
  res.cookie('rt', s.refresh, opts(30 * 24 * 3600_000, '/api/auth')); // refresh faqat auth yo'llariga yuboriladi
}

// Autentifikatsiya yo'llariga qattiqroq cheklov: daqiqada 10 ta so'rov
@Throttle({ default: { limit: 10, ttl: 60_000 } })
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register') @HttpCode(200) register(@Body() dto: RegisterDto) { return this.auth.register(dto); }

  @Post('verify') @HttpCode(200)
  async verify(@Body() dto: VerifyDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const s = await this.auth.verifyRegister(dto.email, dto.code);
    setSession(res, s);
    return { user: s.user };
  }

  @Post('login') @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const s = await this.auth.login(dto.email, dto.password, req.headers['user-agent']);
    setSession(res, s);
    return { user: s.user };
  }

  @Post('login/otp/request') @HttpCode(200) otpRequest(@Body() dto: EmailDto) { return this.auth.requestLoginOtp(dto.email); }

  @Post('login/otp/verify') @HttpCode(200)
  async otpVerify(@Body() dto: VerifyDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const s = await this.auth.verifyLoginOtp(dto.email, dto.code, req.headers['user-agent']);
    setSession(res, s);
    return { user: s.user };
  }

  @Post('forgot') @HttpCode(200) forgot(@Body() dto: EmailDto) { return this.auth.forgot(dto.email); }
  @Post('reset') @HttpCode(200) reset(@Body() dto: ResetDto) { return this.auth.reset(dto.email, dto.code, dto.newPassword); }

  @Post('refresh') @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const s = await this.auth.refresh(req.cookies?.rt, req.headers['user-agent']);
    setSession(res, s);
    return { user: s.user };
  }

  @Post('logout') @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.rt);
    res.clearCookie('at', { path: '/' });
    res.clearCookie('rt', { path: '/api/auth' });
    return { ok: true };
  }

  @Get('me') @UseGuards(JwtAuthGuard) me(@CurrentUser() u: AuthUser) { return this.auth.me(u.id); }
}
