import { Body, Controller, Delete, Get, Module, NotFoundException, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { IsIn } from 'class-validator';
import { PrismaService } from '../prisma/prisma.module';
import { JwtAuthGuard, Roles, RolesGuard } from '../common/auth';

class StatusDto { @IsIn(['OPEN', 'RESOLVED']) status: 'OPEN' | 'RESOLVED' }

/** Aloqa formasidan kelgan murojaatlar va email obunachilar — faqat ADMIN */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class InboxController {
  constructor(private db: PrismaService) {}

  @Get('messages')
  async messages() {
    const [items, open] = await Promise.all([
      this.db.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
      this.db.contactMessage.count({ where: { status: 'OPEN' } }),
    ]);
    return { items, open };
  }
  @Patch('messages/:id')
  async setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() d: StatusDto) {
    const m = await this.db.contactMessage.findUnique({ where: { id } });
    if (!m) throw new NotFoundException();
    return this.db.contactMessage.update({ where: { id }, data: { status: d.status } });
  }
  @Delete('messages/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.db.contactMessage.delete({ where: { id } }).catch(() => { throw new NotFoundException(); });
    return { ok: true };
  }
  @Get('subscribers')
  async subscribers() {
    const [items, total] = await Promise.all([this.db.subscriber.findMany({ orderBy: { createdAt: 'desc' }, take: 500 }), this.db.subscriber.count()]);
    return { items, total };
  }
}

@Module({ controllers: [InboxController] })
export class InboxModule {}
