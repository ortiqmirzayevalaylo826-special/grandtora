'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api, useQuery } from '@/lib/client';
import { Empty, ErrorBox, PageHead, Spinner, useErr } from '@/components/ui';
import GrantItem from '@/components/console/GrantItem';
import { Modal, useL, useToast } from '@/components/admin/kit';
import { Badge } from '@/components/admin/kit';

const RTONE: Record<string, string> = { SUBMITTED: 'amber', IN_REVIEW: 'blue', NEEDS_INFO: 'amber', APPROVED: 'green', REJECTED: 'red' };

/** Arizani platformaga topshirish: motivatsiya + hujjatlar; keyin admin javobi shu yerda ko'rinadi. */
function SubmitBox({ a, onChange }: { a: any; onChange: (n: any) => void }) {
  const L = useL();
  const err = useErr();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string>(a.motivation ?? '');
  const [ids, setIds] = useState<string[]>(Array.isArray(a.docIds) ? a.docIds : []);
  const [busy, setBusy] = useState(false);
  const docs = useQuery<{ id: string; name: string }[]>(open ? '/me/documents' : null);
  const lab = (s: string) => ({ SUBMITTED: L('Topshirildi', 'Подана', 'Submitted'), IN_REVIEW: L("Ko'rib chiqilmoqda", 'На рассмотрении', 'In review'), NEEDS_INFO: L("Ma'lumot kerak", 'Нужна информация', 'Needs info'), APPROVED: L('Qabul qilindi', 'Одобрена', 'Approved'), REJECTED: L('Rad etildi', 'Отклонена', 'Declined') } as Record<string, string>)[s] ?? s;
  async function send() {
    setBusy(true);
    try { const r = await api<any>(`/me/applications/${a.scholarshipId}/submit`, { method: 'POST', body: { motivation: text.trim(), docIds: ids } }); onChange(r); setOpen(false); toast('ok', L('Ariza topshirildi', 'Заявка подана', 'Application submitted')); }
    catch (e: any) { toast('err', e.code === 'profile_incomplete' ? L("Avval profilda davlat va universitetni to'ldiring", 'Сначала заполните страну и университет в профиле', 'Fill in country and university in your profile first') : err(e.code)); }
    finally { setBusy(false); }
  }
  const canSend = !a.review || a.review === 'NEEDS_INFO';
  return (
    <div className="rounded-xl border border-navy/10 bg-canvas p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-navy">{L('Platformaga ariza', 'Заявка на платформе', 'Platform application')}</span>
        {a.review && <Badge tone={RTONE[a.review]}>{lab(a.review)}</Badge>}
        {canSend && <button type="button" className="btn btn-primary ml-auto h-9 px-3 text-xs" onClick={() => setOpen(true)}>{a.review === 'NEEDS_INFO' ? L('Qayta yuborish', 'Отправить снова', 'Resubmit') : L('Ariza topshirish', 'Подать заявку', 'Submit application')}</button>}
      </div>
      {a.reviewNote && <p className="mt-2 rounded-lg bg-white p-2 text-sm text-navy"><b>{L('Admin izohi', 'Комментарий администратора', 'Admin note')}:</b> {a.reviewNote}</p>}
      {!a.review && <p className="mt-1 text-xs text-muted">{L("Motivatsiya va hujjatlaringizni yuboring — administrator ko'rib chiqadi va natijani bildirishnomada ko'rasiz.", 'Отправьте мотивацию и документы — администратор рассмотрит, результат придёт в уведомлениях.', 'Send your motivation and documents — an admin reviews them and you get the result as a notification.')}</p>}
      <Modal open={open} onClose={() => setOpen(false)} title={L('Ariza topshirish', 'Подать заявку', 'Submit application')}
        footer={<><button className="btn btn-ghost" onClick={() => setOpen(false)}>{L('Bekor qilish', 'Отмена', 'Cancel')}</button><button className="btn btn-primary" disabled={busy || text.trim().length < 30 || ids.length === 0} onClick={send}>{busy ? '…' : L('Yuborish', 'Отправить', 'Send')}</button></>}>
        <div className="space-y-4 text-sm">
          <label className="block"><span className="mb-1 block font-bold text-navy">{L('Motivatsiya (kamida 30 belgi)', 'Мотивация (минимум 30 символов)', 'Motivation (min 30 characters)')}</span>
            <textarea className="input h-32 py-2" maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} /></label>
          <div>
            <p className="mb-1 font-bold text-navy">{L('Hujjatlar (kamida bittasi)', 'Документы (минимум один)', 'Documents (at least one)')}</p>
            {docs.loading && <p className="text-muted">…</p>}
            {docs.data && docs.data.length === 0 && <p className="text-muted">{L("Hujjat yo'q. Avval «Hujjatlar» bo'limiga yuklang.", 'Нет документов. Сначала загрузите их в разделе «Документы».', 'No documents yet. Upload them in Documents first.')}</p>}
            {docs.data?.map((d) => (
              <label key={d.id} className="flex items-center gap-2 py-1"><input type="checkbox" checked={ids.includes(d.id)} onChange={() => setIds(ids.includes(d.id) ? ids.filter((x) => x !== d.id) : [...ids, d.id])} /><span className="truncate">{d.name}</span></label>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

const STATUSES = ['INTERESTED', 'PREPARING', 'SUBMITTED', 'REVIEW', 'INTERVIEW', 'ACCEPTED', 'REJECTED'];

function Card({ a: a0, onRemove }: { a: any; onRemove: () => void }) {
  const [a, setA] = useState<any>(a0);
  const t = useTranslations('ap');
  const st = useTranslations('status');
  const c = useTranslations('common');
  const err = useErr();
  const docs: string[] = a.scholarship.tr?.documents ?? [];
  const [status, setStatus] = useState<string>(a.status);
  const [note, setNote] = useState<string>(a.note ?? '');
  const [list, setList] = useState<boolean[]>(Array.from({ length: docs.length }, (_, i) => !!a.checklist?.[i]));
  const [msg, setMsg] = useState('');
  const patch = async (body: object) => {
    try { await api(`/me/applications/${a.scholarshipId}`, { method: 'PATCH', body }); setMsg(c('saved')); setTimeout(() => setMsg(''), 1500); }
    catch (e: any) { setMsg(err(e.code)); }
  };
  const done = list.filter(Boolean).length;
  return (
    <GrantItem s={a.scholarship}
      aside={
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <select className="input h-9 w-auto text-xs" value={status} aria-label={c('status')} onChange={(e) => { setStatus(e.target.value); patch({ status: e.target.value }); }}>
              {STATUSES.map((s) => <option key={s} value={s}>{st(s)}</option>)}
            </select>
            {docs.length > 0 && <span className="text-xs font-semibold text-muted">{t('done', { a: done, b: docs.length })}</span>}
            {msg && <span role="status" className="text-xs font-semibold text-primary">{msg}</span>}
          </div>
          <div>
            <p className="mb-1 text-xs font-bold text-navy">{t('checklist')}</p>
            {docs.length === 0 ? <p className="text-xs text-muted">{t('noList')}</p> : docs.map((d, i) => (
              <label key={d} className="flex items-center gap-2 py-0.5 text-sm">
                <input type="checkbox" checked={list[i]} onChange={() => { const n = list.map((v, j) => (j === i ? !v : v)); setList(n); patch({ checklist: n }); }} />
                <span className={list[i] ? 'text-muted line-through' : ''}>{d}</span>
              </label>
            ))}
          </div>
          <SubmitBox a={a} onChange={(n) => setA({ ...a, ...n })} />
          <textarea className="input h-20 py-2" placeholder={t('note')} aria-label={t('note')} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== (a.note ?? '') && patch({ note })} />
        </div>
      }>
      <button className="btn btn-ghost h-9 px-3 text-xs" onClick={async () => { if (confirm(c('confirm'))) { await api(`/me/applications/${a.scholarshipId}`, { method: 'DELETE' }); onRemove(); } }}>{t('untrack')}</button>
    </GrantItem>
  );
}

export default function Applications() {
  const t = useTranslations('ap');
  const locale = useLocale();
  const { data, error, loading, reload, setData } = useQuery<any[]>(`/me/applications?locale=${locale}`);
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBox code={error ?? 'generic'} onRetry={reload} />;
  return (
    <div>
      <PageHead title={t('title')} />
      {data.length === 0 ? <Empty text={t('empty')} /> : <div className="space-y-3">{data.map((a) => <Card key={a.id} a={a} onRemove={() => setData(data.filter((x) => x.id !== a.id))} />)}</div>}
    </div>
  );
}
