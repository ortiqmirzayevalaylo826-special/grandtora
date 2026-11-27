'use client';
import { FormEvent, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api } from '@/lib/client';
import { useErr } from './ui';

/** Email obuna: /api/subscribe (mavjud email bo'lsa ham bir xil javob) */
export default function SubscribeForm() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const err = useErr();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | string>('idle');
  async function submit(e: FormEvent) {
    e.preventDefault();
    setState('busy');
    try { await api('/subscribe', { body: { email, locale } }); setState('ok'); setEmail(''); }
    catch (x: any) { setState(`e:${x?.code ?? 'generic'}`); }
  }
  if (state === 'ok') return <p role="status" className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white">{t('subOk')}</p>;
  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('subPlaceholder')} aria-label={t('subPlaceholder')}
          className="h-11 min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-white/60" />
        <button className="btn bg-white text-primary-600 hover:bg-accent" disabled={state === 'busy'}>{t('subBtn')}</button>
      </div>
      {state.startsWith('e:') && <p role="alert" className="text-xs text-red-200">{err(state.slice(2))}</p>}
    </form>
  );
}
