import { Controller, Get, Module, Param, Query } from '@nestjs/common';
import { ListQuery, ScholarshipsService } from './scholarships.service';

@Controller('scholarships')
export class ScholarshipsController {
  constructor(private s: ScholarshipsService) {}
  // Aniq yo'llar ':slug' dan OLDIN turishi kerak
  @Get() list(@Query() q: ListQuery) { return this.s.list(q); }
  @Get('countries') countries() { return this.s.countries(); }
  @Get('meta') meta() { return this.s.meta(); }
  @Get(':slug') one(@Param('slug') slug: string, @Query('locale') locale?: string) { return this.s.bySlug(slug, locale); }
  @Get(':slug/similar') similar(@Param('slug') slug: string, @Query('locale') locale?: string) { return this.s.similar(slug, locale); }
  @Get(':slug/reviews') reviews(@Param('slug') slug: string) { return this.s.reviews(slug); }
}

@Module({ controllers: [ScholarshipsController], providers: [ScholarshipsService], exports: [ScholarshipsService] })
export class ScholarshipsModule {}
