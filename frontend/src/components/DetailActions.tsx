'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/client';
import { Notice, useErr } from './ui';

/** Grant sahifasidagi amallar: saqlash, ariza kuzatuvi, xato haqida xabar, sharh. Faqat kirgan talaba uchun. */
export default function DetailActions({ id }: { id: string }) {
  const t = useTranslations('detail');
  const err = useErr();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [tracked, setTracked] = useState(false);
  const [open, setOpen] = useState<null | 'report' | 'review'>(null);
  const [text, setText] = useState('');
  const [stars, setStars] = useState(5);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (user?.role !== 'STUDENT') return;
    api<{ saved: string[]; applications: string[] }>('/me/ids').then((r) => { setSaved(r.saved.includes(id)); setTracked(r.applications.includes(id)); }).catch(() => undefined);
  }, [user, id]);

  if (user === undefined) return null;
  if (!user) return <Link href="/login" className="btn btn-ghost mt-3 w-full">{t('login')}</Link>;
  if (user.role !== 'STUDENT') return null;

  async function toggleSave() {
    const next = !saved; setSaved(next);
    try { await api(`/me/saved/${id}`, { method: next ? 'PUT' : 'DELETE' }); } catch { setSaved(!next); }
  }
  async function track() {
    try { await api(`/me/applications/${id}`, { method: 'PUT' }); setTracked(true); } catch (x: any) { setMsg({ kind: 'err', text: err(x.code) }); }
  }
  async function submit(e: FormEvent) {
    e.preventDefault(); setMsg(null);
    try {
      if (open === 'report') { await api(`/me/report/${id}`, { body: { text } }); setMsg({ kind: 'ok', text: t('reportSent') }); }
      else { await api(`/me/reviews/${id}`, { body: { stars, text } }); setMsg({ kind: 'ok', text: t('reviewSent') }); }
      setText(''); setOpen(null);
    } catch (x: any) { setMsg({ kind: 'err', text: err(x.code) }); }
  }

  return (
    <div className="mt-3 space-y-2">
      <button className={`btn w-full ${saved ? 'btn-primary' : 'btn-ghost'}`} onClick={toggleSave} aria-pressed={saved}>♥ {saved ? t('unsave') : t('save')}</button>
      {tracked ? <Link href="/app/applications" className="btn btn-ghost w-full">{t('tracking')}</Link> : <button className="btn btn-ghost w-full" onClick={track}>{t('track')}</button>}
      <div className="flex gap-3 pt-1 text-xs font-semibold">
        <button className="text-muted underline-offset-2 hover:text-primary hover:underline" onClick={() => { setOpen(open === 'review' ? null : 'review'); setMsg(null); }}>{t('writeReview')}</button>
        <button className="text-muted underline-offset-2 hover:text-primary hover:underline" onClick={() => { setOpen(open === 'report' ? null : 'report'); setMsg(null); }}>{t('report')}</button>
      </div>
      {open && (
        <form onSubmit={submit} className="space-y-2">
          {open === 'review' && (
            <div className="flex gap-1" role="radiogroup" aria-label="stars">
              {[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} role="radio" aria-checked={stars === n} onClick={() => setStars(n)} className={`text-2xl ${n <= stars ? 'text-amber-500' : 'text-navy/20'}`}>★</button>)}
            </div>
          )}
          <textarea className="input h-24 py-2" required minLength={open === 'review' ? 10 : 5} maxLength={open === 'review' ? 1000 : 500} value={text} onChange={(e) => setText(e.target.value)} placeholder={open === 'review' ? t('reviewPh') : t('reportPh')} />
          <button className="btn btn-primary h-10 w-full">{t('send')}</button>
        </form>
      )}
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
    </div>
  );
}
