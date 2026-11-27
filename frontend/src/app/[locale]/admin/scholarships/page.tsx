'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { api, ApiError, useQuery } from '@/lib/client';
import Flag from '@/components/Flag';
import { useErr } from '@/components/ui';
import { Badge, Col, Confirm, DataTable, IconBtn, PageTitle, Pagination, SearchBox, Select, useDateFmt, useL, useTable, useToast } from '@/components/admin/kit';

interface Row {
  id: string; slug: string; title: string; organization: string; countryCode: string; country?: { nameUz: string; nameRu: string; nameEn: string };
  levels: string[]; funding: string; deadline: string | null; rolling: boolean; status: string; views: number; isDemo: boolean; updatedAt: string;
}
interface Page { items: Row[]; total: number; page: number; pages: number; limit: number }
const TONE: Record<string, string> = { PUBLISHED: 'green', PENDING: 'amber', DRAFT: 'gray', REJECTED: 'red', EXPIRED: 'red', ARCHIVED: 'navy' };
const STATUSES = ['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'EXPIRED', 'ARCHIVED'];
const NEXT: Record<string, string[]> = { DRAFT: ['PENDING', 'PUBLISHED', 'ARCHIVED'], PENDING: ['PUBLISHED', 'REJECTED', 'DRAFT'], PUBLISHED: ['ARCHIVED', 'EXPIRED', 'DRAFT'], REJECTED: ['DRAFT', 'PENDING', 'ARCHIVED'], EXPIRED: ['PUBLISHED', 'ARCHIVED'], ARCHIVED: ['DRAFT'] };

export default function AdminGrants() {
  const L = useL();
  const f = useDateFmt();
  const locale = useLocale();
  const err = useErr();
  const toast = useToast();
  const st = useTranslations('sstatus');
  const lv = useTranslations('level');
  const fu = useTranslations('funding');
  const sp = useSearchParams();
  const tb = useTable({ sort: 'updatedAt', f: { status: sp.get('status') ?? '', country: '', level: '', funding: '' } });
  const { data, error, loading, reload } = useQuery<Page>(`/admin/panel/grants?${tb.qs}`);
  const countries = useQuery<{ code: string; nameUz: string; nameRu: string; nameEn: string }[]>('/admin/countries');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [del, setDel] = useState<{ ids: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { const q = sp.get('q'); if (q) tb.setQInput(q); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { setSel(new Set()); }, [tb.qs]);
  const cn = (c: { nameUz: string; nameRu: string; nameEn: string } | undefined, code: string) => (c ? (locale === 'ru' ? c.nameRu : locale === 'en' ? c.nameEn : c.nameUz) : code);
  const ok = (m: string) => toast('ok', m);
  const fail = (x: unknown) => toast('err', err((x as ApiError).code));

  async function setStatus(id: string, status: string) {
    try { await api(`/admin/scholarships/${id}/status`, { method: 'PATCH', body: { status } }); ok(L("Holat o'zgartirildi", 'Статус изменён', 'Status updated')); reload(); } catch (x) { fail(x); }
  }
  async function bulk(action: 'status' | 'delete', ids: string[], status?: string) {
    setBusy(true);
    try {
      const r = await api<{ done: number; skipped: number }>('/admin/panel/grants/bulk', { body: { ids, action, status } });
      ok(L(`${r.done} ta bajarildi${r.skipped ? `, ${r.skipped} ta o'tkazib yuborildi` : ''}`, `Выполнено: ${r.done}${r.skipped ? `, пропущено: ${r.skipped}` : ''}`, `Done: ${r.done}${r.skipped ? `, skipped: ${r.skipped}` : ''}`));
      setSel(new Set()); setDel(null); reload();
    } catch (x) { fail(x); } finally { setBusy(false); }
  }

  const cols: Col<Row>[] = [
    { key: 'title', label: L('Grant nomi', 'Название', 'Grant'), render: (r) => <div className="min-w-0 max-w-[280px]"><Link href={`/admin/scholarships/${r.id}`} className="block truncate font-semibold text-navy hover:text-primary">{r.title}</Link><p className="truncate text-xs text-muted">{r.slug}{r.isDemo ? ` · ${L('namuna', 'демо', 'sample')}` : ''}</p></div> },
    { key: 'country', label: L('Davlat', 'Страна', 'Country'), render: (r) => <span className="flex items-center gap-2"><Flag code={r.countryCode} className="h-4 w-6" /><span className="whitespace-nowrap">{cn(r.country, r.countryCode)}</span></span> },
    { key: 'org', label: L('Tashkilot', 'Организация', 'Organization'), sort: 'organization', render: (r) => <span className="line-clamp-1 max-w-[160px]">{r.organization}</span> },
    { key: 'level', label: L('Daraja', 'Уровень', 'Level'), render: (r) => <span className="text-xs">{r.levels.map((l) => lv(l)).join(', ')}</span> },
    { key: 'fund', label: L('Moliyalashtirish', 'Финансирование', 'Funding'), render: (r) => <span className="whitespace-nowrap text-xs">{fu(r.funding)}</span> },
    { key: 'deadline', label: L('Muddat', 'Срок', 'Deadline'), sort: 'deadline', render: (r) => <span className="whitespace-nowrap text-xs">{r.rolling ? L('Doimiy', 'Постоянно', 'Rolling') : f.date(r.deadline)}</span> },
    { key: 'status', label: L('Holat', 'Статус', 'Status'), sort: 'status', render: (r) => <Badge tone={TONE[r.status]}>{st(r.status)}</Badge> },
    { key: 'views', label: '👁', sort: 'views', render: (r) => <span className="text-xs text-muted">{r.views}</span> },
    { key: 'act', label: L('Amallar', 'Действия', 'Actions'), render: (r) => (
      <div className="flex items-center">
        {NEXT[r.status].includes('PUBLISHED') && <IconBtn icon="check" label={L('Nashr qilish', 'Опубликовать', 'Publish')} tone="hover:!text-primary" onClick={() => setStatus(r.id, 'PUBLISHED')} />}
        {r.status === 'PUBLISHED' && <IconBtn icon="archive" label={L('Arxivlash', 'В архив', 'Archive')} onClick={() => setStatus(r.id, 'ARCHIVED')} />}
        {r.status === 'PUBLISHED' && <IconBtn icon="external" label={L('Saytda ochish', 'Открыть на сайте', 'Open on site')} href={`/${locale}/scholarships/${r.slug}`} />}
        <Link href={`/admin/scholarships/${r.id}`} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-slate-100 hover:text-navy" title={L('Tahrirlash', 'Редактировать', 'Edit')} aria-label={L('Tahrirlash', 'Редактировать', 'Edit')}><svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg></Link>
        <IconBtn icon="trash" label={L("O'chirish", 'Удалить', 'Delete')} tone="hover:!text-red-600" onClick={() => setDel({ ids: [r.id] })} />
      </div>
    ) },
  ];
  const card = (r: Row) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/admin/scholarships/${r.id}`} className="block font-bold text-navy">{r.title}</Link><p className="text-xs text-muted">{r.organization}</p></div><Badge tone={TONE[r.status]}>{st(r.status)}</Badge></div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted"><span className="flex items-center gap-1.5"><Flag code={r.countryCode} className="h-3.5 w-5" />{cn(r.country, r.countryCode)}</span><span>{r.levels.map((l) => lv(l)).join(', ')}</span><span>{r.rolling ? L('Doimiy', 'Постоянно', 'Rolling') : f.date(r.deadline)}</span></div>
      <div className="flex flex-wrap gap-2">
        {NEXT[r.status].includes('PUBLISHED') && <button className="btn btn-primary !h-10 flex-1" onClick={() => setStatus(r.id, 'PUBLISHED')}>{L('Nashr qilish', 'Опубликовать', 'Publish')}</button>}
        <Link href={`/admin/scholarships/${r.id}`} className="btn btn-ghost !h-10 flex-1">{L('Tahrirlash', 'Редактировать', 'Edit')}</Link>
        <button className="btn btn-ghost !h-10 !px-3 text-red-700" onClick={() => setDel({ ids: [r.id] })} aria-label={L("O'chirish", 'Удалить', 'Delete')}>🗑</button>
      </div>
    </div>
  );

  return (
    <div>
      <PageTitle title={L('Grantlar', 'Гранты', 'Grants')} sub={data ? L(`Jami ${data.total} ta`, `Всего: ${data.total}`, `${data.total} in total`) : undefined}>
        <a className="btn btn-ghost" href="/api/admin/export/scholarships.csv">{L('CSV yuklab olish', 'Скачать CSV', 'Download CSV')}</a>
        <Link href="/admin/scholarships/new" className="btn btn-primary">+ {L("Grant qo'shish", 'Добавить грант', 'Add grant')}</Link>
      </PageTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchBox value={tb.qInput} onChange={tb.setQInput} placeholder={L("Grant nomi, tashkilot yoki slug bo'yicha qidirish", 'Поиск по названию, организации или slug', 'Search by title, organization or slug')} />
        <Select value={tb.s.f.country} onChange={(v) => tb.setFilter('country', v)} label={L('Davlat: barchasi', 'Страна: все', 'Country: all')} options={(countries.data ?? []).map((c) => [c.code, cn(c, c.code)])} />
        <Select value={tb.s.f.level} onChange={(v) => tb.setFilter('level', v)} label={L('Daraja: barchasi', 'Уровень: все', 'Level: all')} options={['BACHELOR', 'MASTER', 'PHD', 'POSTDOC', 'SHORT'].map((l) => [l, lv(l)])} />
        <Select value={tb.s.f.funding} onChange={(v) => tb.setFilter('funding', v)} label={L('Moliyalash: barchasi', 'Финансирование: все', 'Funding: all')} options={['FULL', 'PARTIAL', 'TUITION', 'LIVING'].map((l) => [l, fu(l)])} />
        <Select value={tb.s.f.status} onChange={(v) => tb.setFilter('status', v)} label={L('Holat: barchasi', 'Статус: все', 'Status: all')} options={STATUSES.map((s) => [s, st(s)])} />
        {(tb.s.q || Object.values(tb.s.f).some(Boolean)) && <button className="btn btn-ghost" onClick={tb.reset}>{L('Tozalash', 'Сбросить', 'Reset')}</button>}
      </div>

      {sel.size > 0 && (
        <div className="sticky top-16 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-navy px-4 py-3 text-sm text-white shadow-lg">
          <b>{sel.size}</b> {L('ta tanlandi', 'выбрано', 'selected')}
          <span className="mx-1 hidden h-4 w-px bg-white/30 sm:block" />
          <button className="rounded-lg bg-white/15 px-3 py-1.5 font-semibold hover:bg-white/25" disabled={busy} onClick={() => bulk('status', [...sel], 'PUBLISHED')}>{L('Nashr qilish', 'Опубликовать', 'Publish')}</button>
          <button className="rounded-lg bg-white/15 px-3 py-1.5 font-semibold hover:bg-white/25" disabled={busy} onClick={() => bulk('status', [...sel], 'ARCHIVED')}>{L('Arxivlash', 'В архив', 'Archive')}</button>
          <button className="rounded-lg bg-red-500 px-3 py-1.5 font-semibold hover:bg-red-600" disabled={busy} onClick={() => setDel({ ids: [...sel] })}>{L("O'chirish", 'Удалить', 'Delete')}</button>
          <button className="ml-auto text-white/80 hover:text-white" onClick={() => setSel(new Set())}>{L('Bekor qilish', 'Снять', 'Clear')}</button>
        </div>
      )}

      <DataTable cols={cols} rows={data?.items} loading={loading} error={!!error} onRetry={reload} card={card} sort={tb.s.sort} dir={tb.s.dir} onSort={tb.toggleSort} selected={sel} onSelect={setSel}
        empty={L("Grant topilmadi. Filtrlarni o'zgartiring yoki yangi grant qo'shing.", 'Гранты не найдены. Измените фильтры или добавьте грант.', 'No grants found. Change filters or add a grant.')} />
      {data && data.total > 0 && <Pagination page={data.page} pages={data.pages} total={data.total} limit={tb.s.limit} onPage={tb.setPage} onLimit={tb.setLimit} />}

      <Confirm open={!!del} danger busy={busy} onClose={() => setDel(null)} onConfirm={() => del && bulk('delete', del.ids)}
        title={L("Grantni o'chirish", 'Удаление гранта', 'Delete grant')} label={L("O'chirish", 'Удалить', 'Delete')}
        text={L(`${del?.ids.length ?? 0} ta grant butunlay o'chiriladi (saqlanganlar va arizalar ham). Buni qaytarib bo'lmaydi.`, `Будет безвозвратно удалено грантов: ${del?.ids.length ?? 0} (вместе с сохранёнными и заявками).`, `${del?.ids.length ?? 0} grant(s) will be permanently deleted, including saved items and applications. This cannot be undone.`)} />
    </div>
  );
}
