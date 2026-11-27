'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { api, ApiError, useQuery } from '@/lib/client';
import { useErr } from '@/components/ui';
import { Avatar, Badge, Col, Confirm, DataTable, Drawer, IconBtn, PageTitle, Pagination, Panel, SearchBox, Select, Skeleton, useDateFmt, useL, useTable, useToast } from '@/components/admin/kit';

interface Row { id: string; email: string; firstName: string; lastName: string; role: 'STUDENT' | 'ADMIN'; createdAt: string; lastActiveAt: string | null; blockedAt: string | null; emailVerifiedAt: string | null }
interface Page { items: Row[]; total: number; page: number; pages: number; limit: number }
interface Detail {
  user: Row & { locale: string }; profile: any | null; sessions: number; reviews: number;
  saved: { id: string; slug: string; title: string }[]; applications: { id: string; slug: string; title: string; status: string; updatedAt: string }[]; activity: { id: string; action: string; entity: string; createdAt: string }[];
}
const full = (u: { firstName: string; lastName: string; email: string }) => `${u.firstName} ${u.lastName}`.trim() || u.email;

export default function AdminUsers() {
  const L = useL();
  const f = useDateFmt();
  const err = useErr();
  const toast = useToast();
  const lv = useTranslations('level');
  const tb = useTable({ sort: 'createdAt', f: { role: '', status: '' } });
  const { data, error, loading, reload } = useQuery<Page>(`/admin/panel/users?${tb.qs}`);
  const [open, setOpen] = useState<string | null>(null);
  const [block, setBlock] = useState<Row | null>(null);
  const [del, setDel] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const detail = useQuery<Detail>(open ? `/admin/panel/users/${open}` : null);
  const fail = (x: unknown) => toast('err', err((x as ApiError).code));

  const status = (u: Row) => (u.blockedAt ? <Badge tone="red">{L('Bloklangan', 'Заблокирован', 'Blocked')}</Badge> : !u.emailVerifiedAt ? <Badge tone="amber">{L('Tasdiqlanmagan', 'Не подтверждён', 'Unverified')}</Badge> : <Badge tone="green">{L('Faol', 'Активен', 'Active')}</Badge>);
  const role = (u: Row) => <Badge tone={u.role === 'ADMIN' ? 'navy' : 'blue'}>{u.role === 'ADMIN' ? 'Admin' : L('Talaba', 'Студент', 'Student')}</Badge>;

  async function doBlock() {
    if (!block) return; setBusy(true);
    try { await api(`/admin/panel/users/${block.id}/block`, { method: 'PATCH', body: { blocked: !block.blockedAt } }); toast('ok', block.blockedAt ? L('Blokdan chiqarildi', 'Разблокирован', 'Unblocked') : L('Bloklandi', 'Заблокирован', 'Blocked')); setBlock(null); reload(); detail.reload(); } catch (x) { fail(x); } finally { setBusy(false); }
  }
  async function doDelete() {
    if (!del) return; setBusy(true);
    try { await api(`/admin/panel/users/${del.id}`, { method: 'DELETE', body: { confirmEmail: del.email } }); toast('ok', L("Hisob o'chirildi", 'Аккаунт удалён', 'Account deleted')); setDel(null); setOpen(null); reload(); } catch (x) { fail(x); } finally { setBusy(false); }
  }
  async function setRole(u: Row, r: 'STUDENT' | 'ADMIN') {
    try { await api(`/admin/panel/users/${u.id}/role`, { method: 'PATCH', body: { role: r } }); toast('ok', L("Rol o'zgartirildi", 'Роль изменена', 'Role updated')); reload(); detail.reload(); } catch (x) { fail(x); }
  }

  const cols: Col<Row>[] = [
    { key: 'name', label: L('Foydalanuvchi', 'Пользователь', 'User'), sort: 'firstName', render: (u) => <div className="flex min-w-0 items-center gap-3"><Avatar name={full(u)} /><div className="min-w-0"><p className="truncate font-semibold text-navy">{full(u)}</p></div></div> },
    { key: 'email', label: 'Email', sort: 'email', render: (u) => <span className="block max-w-[220px] truncate">{u.email}</span> },
    { key: 'joined', label: L("Ro'yxatdan o'tgan", 'Регистрация', 'Joined'), sort: 'createdAt', render: (u) => <span className="whitespace-nowrap text-xs">{f.date(u.createdAt)}</span> },
    { key: 'role', label: L('Rol', 'Роль', 'Role'), sort: 'role', render: role },
    { key: 'status', label: L('Holat', 'Статус', 'Status'), render: status },
    { key: 'last', label: L('Oxirgi faollik', 'Активность', 'Last active'), sort: 'lastActiveAt', render: (u) => <span className="whitespace-nowrap text-xs text-muted">{f.ago(u.lastActiveAt)}</span> },
    { key: 'act', label: L('Amallar', 'Действия', 'Actions'), render: (u) => (
      <div className="flex">
        <IconBtn icon="eye" label={L('Profilni ochish', 'Открыть профиль', 'Open profile')} onClick={() => setOpen(u.id)} />
        <IconBtn icon="ban" label={u.blockedAt ? L('Blokdan chiqarish', 'Разблокировать', 'Unblock') : L('Bloklash', 'Заблокировать', 'Block')} tone={u.blockedAt ? 'hover:!text-primary' : 'hover:!text-amber-600'} onClick={() => setBlock(u)} />
        {u.role === 'STUDENT' && <IconBtn icon="trash" label={L("Hisobni o'chirish", 'Удалить аккаунт', 'Delete account')} tone="hover:!text-red-600" onClick={() => setDel(u)} />}
      </div>
    ) },
  ];
  const card = (u: Row) => (
    <div className="space-y-3">
      <div className="flex items-center gap-3"><Avatar name={full(u)} size="h-11 w-11 text-sm" /><div className="min-w-0 flex-1"><p className="truncate font-bold text-navy">{full(u)}</p><p className="truncate text-xs text-muted">{u.email}</p></div></div>
      <div className="flex flex-wrap items-center gap-2">{role(u)}{status(u)}<span className="text-xs text-muted">{f.date(u.createdAt)}</span></div>
      <div className="flex gap-2"><button className="btn btn-ghost !h-10 flex-1" onClick={() => setOpen(u.id)}>{L('Profil', 'Профиль', 'Profile')}</button><button className="btn btn-ghost !h-10 flex-1" onClick={() => setBlock(u)}>{u.blockedAt ? L('Blokdan chiqarish', 'Разблокировать', 'Unblock') : L('Bloklash', 'Заблокировать', 'Block')}</button></div>
    </div>
  );

  const d = detail.data;
  const p = d?.profile;
  const info = (label: string, v?: string | number | null) => v ? <div className="min-w-0"><dt className="text-xs text-muted">{label}</dt><dd className="truncate text-sm font-semibold text-navy">{v}</dd></div> : null;

  return (
    <div>
      <PageTitle title={L('Foydalanuvchilar', 'Пользователи', 'Users')} sub={data ? L(`Jami ${data.total} ta`, `Всего: ${data.total}`, `${data.total} in total`) : undefined} />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchBox value={tb.qInput} onChange={tb.setQInput} placeholder={L('Ism, email bo‘yicha qidirish', 'Поиск по имени или email', 'Search by name or email')} />
        <Select value={tb.s.f.role} onChange={(v) => tb.setFilter('role', v)} label={L('Rol: barchasi', 'Роль: все', 'Role: all')} options={[['STUDENT', L('Talaba', 'Студент', 'Student')], ['ADMIN', 'Admin']]} />
        <Select value={tb.s.f.status} onChange={(v) => tb.setFilter('status', v)} label={L('Holat: barchasi', 'Статус: все', 'Status: all')} options={[['active', L('Faol', 'Активен', 'Active')], ['blocked', L('Bloklangan', 'Заблокирован', 'Blocked')], ['unverified', L('Tasdiqlanmagan', 'Не подтверждён', 'Unverified')]]} />
        {(tb.s.q || tb.s.f.role || tb.s.f.status) && <button className="btn btn-ghost" onClick={tb.reset}>{L('Tozalash', 'Сбросить', 'Reset')}</button>}
      </div>
      <DataTable cols={cols} rows={data?.items} loading={loading} error={!!error} onRetry={reload} card={card} sort={tb.s.sort} dir={tb.s.dir} onSort={tb.toggleSort} onRow={(u) => setOpen(u.id)}
        empty={L('Foydalanuvchi topilmadi', 'Пользователи не найдены', 'No users found')} />
      {data && data.total > 0 && <Pagination page={data.page} pages={data.pages} total={data.total} limit={tb.s.limit} onPage={tb.setPage} onLimit={tb.setLimit} />}

      <Drawer open={!!open} onClose={() => setOpen(null)} title={d ? full(d.user) : L('Profil', 'Профиль', 'Profile')}>
        {detail.error ? <p className="text-red-700">{L("Yuklanmadi", 'Не загружено', 'Failed to load')}</p> : !d ? <Skeleton rows={4} /> : (
          <div className="space-y-5">
            <div className="flex items-center gap-4"><Avatar name={full(d.user)} size="h-16 w-16 text-xl" /><div className="min-w-0"><p className="truncate text-lg font-bold">{full(d.user)}</p><p className="truncate text-sm text-muted">{d.user.email}</p><div className="mt-1 flex flex-wrap gap-2">{role(d.user)}{status(d.user)}</div></div></div>
            <Panel title={L("Shaxsiy ma'lumotlar", 'Личные данные', 'Personal info')}>
              <dl className="grid grid-cols-2 gap-3">
                {info(L("Ro'yxatdan o'tgan", 'Регистрация', 'Joined'), f.dt(d.user.createdAt))}
                {info(L('Oxirgi faollik', 'Активность', 'Last active'), f.dt(d.user.lastActiveAt))}
                {info(L('Email tasdiqlangan', 'Email подтверждён', 'Email verified'), d.user.emailVerifiedAt ? f.date(d.user.emailVerifiedAt) : L('Yo‘q', 'Нет', 'No'))}
                {info(L('Til', 'Язык', 'Language'), d.user.locale.toUpperCase())}
                {info(L('Telefon', 'Телефон', 'Phone'), p?.phone)}{info(L('Davlat', 'Страна', 'Country'), p?.country)}
                {info(L('Faol sessiyalar', 'Активные сессии', 'Active sessions'), d.sessions)}{info(L('Sharhlar', 'Отзывы', 'Reviews'), d.reviews)}
              </dl>
            </Panel>
            <Panel title={L("Ta'lim ma'lumotlari", 'Образование', 'Education')}>
              {p && (p.university || p.faculty || p.major || p.level || p.gpa || p.ielts) ? (
                <dl className="grid grid-cols-2 gap-3">{info(L('Universitet', 'Университет', 'University'), p.university)}{info(L('Fakultet', 'Факультет', 'Faculty'), p.faculty)}{info(L("Yo'nalish", 'Направление', 'Major'), p.major)}{info(L('Bosqich', 'Уровень', 'Level'), p.level ? lv(p.level) : null)}{info('GPA', p.gpa)}{info('IELTS', p.ielts)}</dl>
              ) : <p className="text-sm text-muted">{L("Ma'lumot kiritilmagan", 'Данные не заполнены', 'Not filled in')}</p>}
              {p?.interests && <p className="mt-3 text-sm"><b>{L('Qiziqishlar', 'Интересы', 'Interests')}:</b> {p.interests}</p>}
            </Panel>
            <Panel title={`${L('Sevimli grantlar', 'Избранные гранты', 'Saved grants')} (${d.saved.length})`}>
              {d.saved.length === 0 ? <p className="text-sm text-muted">—</p> : <ul className="space-y-1.5 text-sm">{d.saved.map((s) => <li key={s.id} className="truncate">♥ <Link href={`/admin/scholarships?q=${s.slug}`} className="hover:text-primary">{s.title}</Link></li>)}</ul>}
            </Panel>
            <Panel title={`${L('Arizalar tarixi', 'История заявок', 'Applications')} (${d.applications.length})`}>
              {d.applications.length === 0 ? <p className="text-sm text-muted">—</p> : <ul className="space-y-2 text-sm">{d.applications.map((a) => <li key={a.id} className="flex items-center justify-between gap-2"><span className="truncate">{a.title}</span><Badge tone="navy">{a.status}</Badge></li>)}</ul>}
            </Panel>
            <Panel title={L('Faollik tarixi', 'История активности', 'Activity')}>
              {d.activity.length === 0 ? <p className="text-sm text-muted">—</p> : <ul className="space-y-2 text-sm">{d.activity.map((a) => <li key={a.id} className="flex justify-between gap-2"><span className="truncate">{a.action} · {a.entity}</span><span className="shrink-0 text-xs text-muted">{f.dt(a.createdAt)}</span></li>)}</ul>}
            </Panel>
            <div className="flex flex-wrap gap-2 border-t border-[#E5E7EB] pt-4">
              <button className="btn btn-ghost" onClick={() => setBlock(d.user)}>{d.user.blockedAt ? L('Blokdan chiqarish', 'Разблокировать', 'Unblock') : L('Bloklash', 'Заблокировать', 'Block')}</button>
              <button className="btn btn-ghost" onClick={() => setRole(d.user, d.user.role === 'ADMIN' ? 'STUDENT' : 'ADMIN')}>{d.user.role === 'ADMIN' ? L('Talabaga aylantirish', 'Сделать студентом', 'Make student') : L('Admin qilish', 'Сделать админом', 'Make admin')}</button>
              {d.user.role === 'STUDENT' && <button className="btn bg-red-600 text-white hover:bg-red-700" onClick={() => setDel(d.user)}>{L("Hisobni o'chirish", 'Удалить аккаунт', 'Delete account')}</button>}
            </div>
          </div>
        )}
      </Drawer>

      <Confirm open={!!block} busy={busy} danger={!block?.blockedAt} onClose={() => setBlock(null)} onConfirm={doBlock}
        title={block?.blockedAt ? L('Blokdan chiqarish', 'Разблокировка', 'Unblock user') : L('Foydalanuvchini bloklash', 'Блокировка пользователя', 'Block user')}
        text={block?.blockedAt ? L(`${block?.email} yana tizimga kira oladi.`, `${block?.email} снова сможет войти.`, `${block?.email} will be able to sign in again.`) : L(`${block?.email} tizimga kira olmaydi va barcha sessiyalari yopiladi.`, `${block?.email} не сможет войти, все сессии будут закрыты.`, `${block?.email} will be signed out everywhere and cannot sign in.`)} />
      <Confirm open={!!del} busy={busy} danger confirmText={del?.email} onClose={() => setDel(null)} onConfirm={doDelete} label={L("O'chirish", 'Удалить', 'Delete')}
        title={L("Hisobni o'chirish", 'Удаление аккаунта', 'Delete account')}
        text={L("Hisob va unga bog'liq barcha ma'lumotlar (profil, arizalar, hujjatlar) butunlay o'chiriladi. Buni qaytarib bo'lmaydi.", 'Аккаунт и все связанные данные (профиль, заявки, документы) будут удалены безвозвратно.', 'The account and all related data (profile, applications, documents) will be permanently deleted.')} />
    </div>
  );
}
