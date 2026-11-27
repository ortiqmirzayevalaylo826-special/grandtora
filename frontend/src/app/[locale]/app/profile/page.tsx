'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, useQuery } from '@/lib/client';
import { ErrorBox, Field, Notice, PageHead, Spinner, useErr } from '@/components/ui';
import { Tabs, useL } from '@/components/admin/kit';
import { AvatarUploader, NameLangForm, SettingsCard as Card } from '@/components/AccountParts';

const LEVELS = ['BACHELOR', 'MASTER', 'PHD', 'POSTDOC', 'SHORT'];
const num = (v: string) => (v.trim() === '' ? null : Number(v));
type Tab = 'personal' | 'education' | 'goals';

export default function Profile() {
  const t = useTranslations('pf');
  const root = useTranslations();
  const c = useTranslations('common');
  const L = useL();
  const err = useErr();
  const { data, error, loading, reload } = useQuery<any>('/me/profile');
  const ov = useQuery<{ profilePercent: number }>('/me/overview?locale=uz');
  const [tab, setTab] = useState<Tab>('personal');
  const [f, setF] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    const s = (v: unknown) => (v == null ? '' : String(v));
    setF({ phone: s(data.phone), country: s(data.country), university: s(data.university), faculty: s(data.faculty), major: s(data.major), level: s(data.level), gpa: s(data.gpa), ielts: s(data.ielts), birthYear: s(data.birthYear), languages: (data.languages ?? []).join(', '), interests: s(data.interests), achievements: s(data.achievements) });
  }, [data]);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const text = (k: string) => (f[k]?.trim() ? f[k].trim() : null);
    try {
      await api('/me/profile', { method: 'PUT', body: {
        phone: text('phone'), country: text('country'), university: text('university'), faculty: text('faculty'), major: text('major'),
        level: f.level || null, gpa: num(f.gpa ?? ''), ielts: num(f.ielts ?? ''), birthYear: num(f.birthYear ?? ''),
        languages: (f.languages ?? '').split(',').map((x) => x.trim()).filter(Boolean), interests: text('interests'), achievements: text('achievements'),
      } });
      setMsg({ kind: 'ok', text: c('saved') }); ov.reload();
    } catch (x: any) { setMsg({ kind: 'err', text: err(x.code) }); } finally { setBusy(false); }
  }

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorBox code={error} onRetry={reload} />;
  const pct = ov.data?.profilePercent;
  const save = (
    <>
      {msg && <div className="sm:col-span-2"><Notice kind={msg.kind}>{msg.text}</Notice></div>}
      <div className="sm:col-span-2"><button className="btn btn-primary" disabled={busy}>{busy ? '…' : c('save')}</button></div>
    </>
  );
  return (
    <div className="space-y-5">
      <PageHead title={t('title')}>{pct !== undefined && <span className="rounded-full bg-accent px-3 py-1 text-sm font-bold text-primary">{pct}%</span>}</PageHead>
      <Tabs value={tab} onChange={(v) => { setTab(v); setMsg(null); }} items={[
        { v: 'personal', label: L('Shaxsiy', 'Личное', 'Personal') },
        { v: 'education', label: L("Ta'lim", 'Образование', 'Education') },
        { v: 'goals', label: L('Qiziqish va yutuqlar', 'Интересы и достижения', 'Interests & achievements') },
      ]} />
      {tab === 'personal' && (
        <div className="space-y-5">
          <Card title={L('Profil rasmi', 'Фото профиля', 'Profile photo')}><AvatarUploader /></Card>
          <Card title={L('Ism va til', 'Имя и язык', 'Name & language')}><NameLangForm /></Card>
          <Card title={L('Aloqa', 'Контакты', 'Contact')}>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <Field label={t('phone')}><input className="input" value={f.phone ?? ''} onChange={set('phone')} autoComplete="tel" maxLength={30} /></Field>
              <Field label={t('country')}><input className="input" value={f.country ?? ''} onChange={set('country')} maxLength={80} /></Field>
              <Field label={t('birthYear')}><input className="input" type="number" min="1950" max="2100" value={f.birthYear ?? ''} onChange={set('birthYear')} /></Field>
              <Field label={t('languages')}><input className="input" value={f.languages ?? ''} onChange={set('languages')} placeholder="uz, ru, en" /></Field>
              {save}
            </form>
          </Card>
        </div>
      )}
      {tab === 'education' && (
        <Card title={L("Ta'lim ma'lumotlari", 'Сведения об образовании', 'Education details')} hint={L("Tavsiyalar shu ma'lumotlarga asoslanadi.", 'Рекомендации строятся на этих данных.', 'Recommendations are based on these details.')}>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Field label={t('university')}><input className="input" value={f.university ?? ''} onChange={set('university')} maxLength={120} /></Field>
            <Field label={t('faculty')}><input className="input" value={f.faculty ?? ''} onChange={set('faculty')} maxLength={120} /></Field>
            <Field label={t('major')}><input className="input" value={f.major ?? ''} onChange={set('major')} maxLength={40} /></Field>
            <Field label={t('level')}><select className="input" value={f.level ?? ''} onChange={set('level')}><option value="">{t('none')}</option>{LEVELS.map((l) => <option key={l} value={l}>{root(`level.${l}`)}</option>)}</select></Field>
            <Field label={t('gpa')}><input className="input" type="number" step="0.01" min="0" max="4" value={f.gpa ?? ''} onChange={set('gpa')} /></Field>
            <Field label={t('ielts')}><input className="input" type="number" step="0.5" min="0" max="9" value={f.ielts ?? ''} onChange={set('ielts')} /></Field>
            {save}
          </form>
        </Card>
      )}
      {tab === 'goals' && (
        <Card title={L('Qiziqish va yutuqlar', 'Интересы и достижения', 'Interests & achievements')}>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Field label={t('interests')} className="sm:col-span-2"><textarea className="input h-24 py-2" maxLength={500} value={f.interests ?? ''} onChange={set('interests')} /></Field>
            <Field label={t('achievements')} className="sm:col-span-2"><textarea className="input h-28 py-2" maxLength={1000} value={f.achievements ?? ''} onChange={set('achievements')} /></Field>
            <p className="text-xs text-muted sm:col-span-2">{t('privacy')}</p>
            {save}
          </form>
        </Card>
      )}
    </div>
  );
}
