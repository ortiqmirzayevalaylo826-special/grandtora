'use client';
import { useState } from 'react';
import { api, ApiError, useQuery } from '@/lib/client';
import { Badge, useL } from './admin/kit';

interface St { provider: string; from: string; configured: boolean; relayUrl: boolean; relayToken: boolean; brevoKey: boolean; smtpHost: boolean }

/** Admin uchun pochta diagnostikasi: sozlama holati va test xat yuborish (xato matni ko'rsatiladi). */
export default function MailCheck() {
  const L = useL();
  const { data, error } = useQuery<St>('/admin/panel/mail/status');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; error: string | null; to: string } | null>(null);
  async function test() {
    setBusy(true); setRes(null);
    try { setRes(await api('/admin/panel/mail/test', { method: 'POST', body: {} })); } catch (x) { setRes({ ok: false, error: (x as ApiError).code ?? 'error', to: '' }); } finally { setBusy(false); }
  }
  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!data) return <p className="text-sm text-muted">…</p>;
  const flag = (ok: boolean, name: string) => <li className="flex items-center gap-2">{ok ? <Badge tone="green">OK</Badge> : <Badge tone="red">{L("yo'q", 'нет', 'missing')}</Badge>}<span>{name}</span></li>;
  return (
    <div className="space-y-3 text-sm">
      <p><b>{L('Usul', 'Способ', 'Provider')}:</b> {data.provider} · <b>From:</b> {data.from}</p>
      <ul className="grid gap-1">
        {data.provider === 'gmail' && <>{flag(data.relayUrl, 'EMAIL_RELAY_URL')}{flag(data.relayToken, 'EMAIL_RELAY_TOKEN')}</>}
        {data.provider === 'brevo' && flag(data.brevoKey, 'BREVO_API_KEY')}
        {data.provider === 'smtp' && flag(data.smtpHost, 'SMTP_HOST')}
      </ul>
      <button className="btn btn-primary" disabled={busy} onClick={test}>{busy ? '…' : L('Test xat yuborish', 'Отправить тестовое письмо', 'Send test email')}</button>
      {res && <p className={`rounded-xl p-3 ${res.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>{res.ok ? L(`Yuborildi: ${res.to}. Pochtangizni (Spam ham) tekshiring.`, `Отправлено: ${res.to}. Проверьте почту (и Спам).`, `Sent to ${res.to}. Check your inbox (and Spam).`) : res.error}</p>}
    </div>
  );
}
