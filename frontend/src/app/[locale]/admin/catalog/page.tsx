'use client';
import { useState } from 'react';
import { api, ApiError, useQuery } from '@/lib/client';
import Flag from '@/components/Flag';
import { useErr } from '@/components/ui';
import { Badge, Confirm, EmptyState, ErrorState, Modal, PageTitle, Panel, Skeleton, Tabs, useL, useToast } from '@/components/admin/kit';

interface Country { code: string; nameUz: string; nameRu: string; nameEn: string; infoUz: string | null; infoRu: string | null; infoEn: string | null; active: boolean; grants: number }
interface Cat { id: string; slug: string; nameUz: string; nameRu: string; nameEn: string; _count?: { scholarships: number } }

export default function AdminCatalog() {
  const L = useL();
  const err = useErr();
  const toast = useToast();
  const lvT = (l: string) => ({ BACHELOR: L('Bakalavr', 'Бакалавриат', 'Bachelor'), MASTER: L('Magistratura', 'Магистратура', 'Master'), PHD: 'PhD', POSTDOC: 'Postdoc', SHORT: L('Qisqa kurs', 'Краткий курс', 'Short course') }[l] ?? l);
  const [tab, setTab] = useState<'c' | 'k' | 'l'>('c');
  const countries = useQuery<Country[]>('/admin/panel/countries');
  const cats = useQuery<Cat[]>(tab === 'k' ? '/admin/categories' : null);
  const levels = useQuery<{ level: string; n: number }[]>(tab === 'l' ? '/admin/panel/levels' : null);
  const [ec, setEc] = useState<Country | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [ek, setEk] = useState<Partial<Cat> | null>(null);
  const [dk, setDk] = useState<Cat | null>(null);
  const [busy, setBusy] = useState(false);
  const fail = (x: unknown) => toast('err', err((x as ApiError).code));

  async function saveCountry() {
    if (!ec) return; setBusy(true);
    try { await api('/admin/panel/countries', { method: 'PUT', body: { code: ec.code.toUpperCase(), nameUz: ec.nameUz, nameRu: ec.nameRu, nameEn: ec.nameEn, infoUz: ec.infoUz ?? '', infoRu: ec.infoRu ?? '', infoEn: ec.infoEn ?? '', active: ec.active } }); toast('ok', L('Saqlandi', 'Сохранено', 'Saved')); setEc(null); countries.reload(); } catch (x) { fail(x); } finally { setBusy(false); }
  }
  async function toggle(c: Country) {
    try { await api(`/admin/panel/countries/${c.code}/active`, { method: 'PATCH', body: { active: !c.active } }); countries.reload(); } catch (x) { fail(x); }
  }
  async function saveCat() {
    if (!ek) return; setBusy(true);
    try {
      const body = { slug: ek.slug, nameUz: ek.nameUz, nameRu: ek.nameRu, nameEn: ek.nameEn };
      if (ek.id) await api(`/admin/categories/${ek.id}`, { method: 'PUT', body }); else await api('/admin/categories', { body });
      toast('ok', L('Saqlandi', 'Сохранено', 'Saved')); setEk(null); cats.reload();
    } catch (x) { fail(x); } finally { setBusy(false); }
  }
  async function delCat() {
    if (!dk) return; setBusy(true);
    try { await api(`/admin/categories/${dk.id}`, { method: 'DELETE' }); toast('ok', L("O'chirildi", 'Удалено', 'Deleted')); setDk(null); cats.reload(); } catch (x) { fail(x); } finally { setBusy(false); }
  }
  const inp = (label: string, v: string | null | undefined, on: (s: string) => void, extra: object = {}) => (
    <label className="block text-xs font-semibold text-muted">{label}<input className="input mt-1" value={v ?? ''} onChange={(e) => on(e.target.value)} {...extra} /></label>
  );

  return (
    <div>
      <PageTitle title={L('Davlat va kategoriyalar', 'Страны и категории', 'Countries & categories')} sub={L("Katalog filtrlari uchun ro'yxatlar", 'Справочники для фильтров каталога', 'Lists that power catalog filters')}>
        {tab === 'c' && <button className="btn btn-primary" onClick={() => { setIsNew(true); setEc({ code: '', nameUz: '', nameRu: '', nameEn: '', infoUz: '', infoRu: '', infoEn: '', active: true, grants: 0 }); }}>+ {L("Davlat qo'shish", 'Добавить страну', 'Add country')}</button>}
        {tab === 'k' && <button className="btn btn-primary" onClick={() => setEk({ slug: '', nameUz: '', nameRu: '', nameEn: '' })}>+ {L("Kategoriya qo'shish", 'Добавить категорию', 'Add category')}</button>}
      </PageTitle>
      <Tabs value={tab} onChange={setTab} items={[{ v: 'c', label: L('Davlatlar', 'Страны', 'Countries') }, { v: 'k', label: L('Kategoriyalar', 'Категории', 'Categories') }, { v: 'l', label: L("Ta'lim darajalari", 'Уровни образования', 'Study levels') }]} />

      {tab === 'c' && (countries.error ? <ErrorState onRetry={countries.reload} /> : !countries.data ? <Skeleton /> : countries.data.length === 0 ? <EmptyState text={L("Davlatlar yo'q", 'Стран нет', 'No countries')} /> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {countries.data.map((c) => (
            <div key={c.code} className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
              <div className="flex items-center gap-3"><Flag code={c.code} className="h-6 w-9 rounded" /><div className="min-w-0 flex-1"><p className="truncate font-bold text-navy">{c.nameUz}</p><p className="truncate text-xs text-muted">{c.nameRu} · {c.nameEn}</p></div><Badge tone={c.active ? 'green' : 'gray'}>{c.active ? L('Faol', 'Активна', 'Active') : L('Nofaol', 'Неактивна', 'Inactive')}</Badge></div>
              <p className="mt-2 text-xs text-muted">{L('Grantlar', 'Гранты', 'Grants')}: <b className="text-navy">{c.grants}</b></p>
              <div className="mt-3 flex gap-2"><button className="btn btn-ghost !h-9 flex-1" onClick={() => { setIsNew(false); setEc(c); }}>{L('Tahrirlash', 'Изменить', 'Edit')}</button><button className="btn btn-ghost !h-9 flex-1" onClick={() => toggle(c)}>{c.active ? L("O'chirish", 'Отключить', 'Deactivate') : L('Yoqish', 'Включить', 'Activate')}</button></div>
            </div>
          ))}
        </div>
      ))}

      {tab === 'k' && (cats.error ? <ErrorState onRetry={cats.reload} /> : !cats.data ? <Skeleton /> : cats.data.length === 0 ? <EmptyState text={L("Kategoriyalar yo'q", 'Категорий нет', 'No categories')} /> : (
        <Panel>
          <ul className="divide-y divide-[#E5E7EB]">
            {cats.data.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1"><p className="truncate font-semibold text-navy">{k.nameUz}</p><p className="truncate text-xs text-muted">{k.nameRu} · {k.nameEn} · {k.slug}</p></div>
                <button className="btn btn-ghost !h-9" onClick={() => setEk(k)}>{L('Tahrirlash', 'Изменить', 'Edit')}</button>
                <button className="btn btn-ghost !h-9 text-red-700" onClick={() => setDk(k)}>{L("O'chirish", 'Удалить', 'Delete')}</button>
              </li>
            ))}
          </ul>
        </Panel>
      ))}

      {tab === 'l' && (levels.error ? <ErrorState onRetry={levels.reload} /> : !levels.data ? <Skeleton rows={3} /> : (
        <Panel title={L("Daraja bo'yicha grantlar soni", 'Количество грантов по уровням', 'Grants per level')}>
          <ul className="divide-y divide-[#E5E7EB]">{levels.data.map((l) => <li key={l.level} className="flex items-center justify-between py-3"><span className="font-semibold text-navy">{lvT(l.level)}</span><Badge tone="navy">{l.n}</Badge></li>)}</ul>
          <p className="mt-3 text-xs text-muted">{L("Darajalar tizim darajasida belgilangan; grant formasida tanlanadi.", 'Уровни заданы на уровне системы и выбираются в форме гранта.', 'Levels are fixed system-wide and chosen in the grant form.')}</p>
        </Panel>
      ))}

      <Modal open={!!ec} onClose={() => setEc(null)} title={isNew ? L("Davlat qo'shish", 'Добавить страну', 'Add country') : L('Davlatni tahrirlash', 'Редактирование страны', 'Edit country')}
        footer={<><button className="btn btn-ghost" onClick={() => setEc(null)}>{L('Bekor qilish', 'Отмена', 'Cancel')}</button><button className="btn btn-primary" disabled={busy} onClick={saveCountry}>{L('Saqlash', 'Сохранить', 'Save')}</button></>}>
        {ec && <div className="space-y-3">
          {inp(L('Kod (ISO, masalan KR)', 'Код (ISO, например KR)', 'Code (ISO, e.g. KR)'), ec.code, (v) => setEc({ ...ec, code: v.toUpperCase().slice(0, 2) }), { disabled: !isNew, maxLength: 2 })}
          {inp("Nomi (UZ)", ec.nameUz, (v) => setEc({ ...ec, nameUz: v }))}{inp('Название (RU)', ec.nameRu, (v) => setEc({ ...ec, nameRu: v }))}{inp('Name (EN)', ec.nameEn, (v) => setEc({ ...ec, nameEn: v }))}
          <label className="block text-xs font-semibold text-muted">{L("Tavsif (UZ)", 'Описание (UZ)', 'Description (UZ)')}<textarea className="input mt-1 min-h-20 py-2" maxLength={1500} value={ec.infoUz ?? ''} onChange={(e) => setEc({ ...ec, infoUz: e.target.value })} /></label>
          <label className="block text-xs font-semibold text-muted">{L("Tavsif (RU)", 'Описание (RU)', 'Description (RU)')}<textarea className="input mt-1 min-h-20 py-2" maxLength={1500} value={ec.infoRu ?? ''} onChange={(e) => setEc({ ...ec, infoRu: e.target.value })} /></label>
          <label className="block text-xs font-semibold text-muted">{L("Tavsif (EN)", 'Описание (EN)', 'Description (EN)')}<textarea className="input mt-1 min-h-20 py-2" maxLength={1500} value={ec.infoEn ?? ''} onChange={(e) => setEc({ ...ec, infoEn: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={ec.active} onChange={(e) => setEc({ ...ec, active: e.target.checked })} />{L('Katalogda faol', 'Активна в каталоге', 'Active in catalog')}</label>
        </div>}
      </Modal>
      <Modal open={!!ek} onClose={() => setEk(null)} title={ek?.id ? L('Kategoriyani tahrirlash', 'Редактирование категории', 'Edit category') : L("Kategoriya qo'shish", 'Добавить категорию', 'Add category')}
        footer={<><button className="btn btn-ghost" onClick={() => setEk(null)}>{L('Bekor qilish', 'Отмена', 'Cancel')}</button><button className="btn btn-primary" disabled={busy} onClick={saveCat}>{L('Saqlash', 'Сохранить', 'Save')}</button></>}>
        {ek && <div className="space-y-3">
          {inp('Slug', ek.slug, (v) => setEk({ ...ek, slug: v.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
          {inp("Nomi (UZ)", ek.nameUz, (v) => setEk({ ...ek, nameUz: v }))}{inp('Название (RU)', ek.nameRu, (v) => setEk({ ...ek, nameRu: v }))}{inp('Name (EN)', ek.nameEn, (v) => setEk({ ...ek, nameEn: v }))}
        </div>}
      </Modal>
      <Confirm open={!!dk} danger busy={busy} onClose={() => setDk(null)} onConfirm={delCat} label={L("O'chirish", 'Удалить', 'Delete')} title={L("Kategoriyani o'chirish", 'Удалить категорию', 'Delete category')} text={`${dk?.nameUz ?? ''}`} />
    </div>
  );
}
