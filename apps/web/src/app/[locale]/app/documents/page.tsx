'use client';
import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api, useQuery } from '@/lib/client';
import { Empty, ErrorBox, Notice, PageHead, Spinner, useErr } from '@/components/ui';

const MAX = 5 * 1024 * 1024;
const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default function Documents() {
  const t = useTranslations('dc');
  const c = useTranslations('common');
  const err = useErr();
  const locale = useLocale();
  const { data, error, loading, reload, setData } = useQuery<any[]>('/me/documents');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX) return setMsg({ kind: 'err', text: t('tooBig') });
    setBusy(true); setMsg(null);
    try {
      const fd = new FormData(); fd.append('file', file);
      await api('/me/documents', { form: fd });
      setMsg({ kind: 'ok', text: t('uploaded') });
      reload();
    } catch (x: any) { setMsg({ kind: 'err', text: err(x.code) }); } finally { setBusy(false); }
  }

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBox code={error ?? 'generic'} onRetry={reload} />;
  return (
    <div>
      <PageHead title={t('title')}>
        <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={onPick} />
        <button className="btn btn-primary" disabled={busy} onClick={() => input.current?.click()}>{busy ? c('loading') : `⬆ ${c('upload')}`}</button>
      </PageHead>
      <p className="mb-4 text-sm text-muted">{t('hint')}</p>
      {msg && <div className="mb-4"><Notice kind={msg.kind}>{msg.text}</Notice></div>}
      {data.length === 0 ? <Empty text={t('empty')} /> : (
        <ul className="space-y-2">
          {data.map((d) => (
            <li key={d.id} className="card flex flex-wrap items-center gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-xs font-extrabold text-primary-600">{d.mime === 'application/pdf' ? 'PDF' : 'IMG'}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-navy">{d.name}</p>
                <p className="text-xs text-muted">{kb(d.sizeBytes)} · {new Date(d.createdAt).toLocaleDateString(locale)}</p>
              </div>
              <a className="btn btn-ghost h-9 px-3 text-xs" href={`/api/me/documents/${d.id}/download`}>{c('download')}</a>
              <button className="btn btn-ghost h-9 px-3 text-xs" onClick={async () => { if (!confirm(c('confirm'))) return; await api(`/me/documents/${d.id}`, { method: 'DELETE' }); setData(data.filter((x) => x.id !== d.id)); }}>{c('delete')}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
