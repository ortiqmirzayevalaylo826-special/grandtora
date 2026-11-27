import { Controller, Get, Module } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { ScholarshipsModule } from './scholarships/scholarships.module';
import { MeModule } from './me/me.module';
import { AdminModule } from './admin/admin.module';
import { JobsModule } from './jobs/jobs.module';
import { StorageModule } from './storage/storage.module';
import { PublicModule } from './public/public.module';
import { InboxModule } from './admin/inbox.module';
import { PanelModule } from './admin/panel.module';

/** Render sog'liq tekshiruvi */
@SkipThrottle()
@Controller('health')
export class HealthController { @Get() ok() { return { ok: true, t: Date.now() }; } }

@Module({
  controllers: [HealthController],
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]), // umumiy tezlik cheklovi
    ScheduleModule.forRoot(),
    JwtModule.register({ global: true }),
    PrismaModule, MailModule, StorageModule, AuthModule, ScholarshipsModule, MeModule, AdminModule, InboxModule, PanelModule, PublicModule, JobsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
