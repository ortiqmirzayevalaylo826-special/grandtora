'use client';
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { Icon } from '@/components/ui';

/** Admin panel matnlari uchun: uz / ru / en variantlarini joyida yozish */
export function useL() {
  const l = useLocale();
  return useCallback((uz: string, ru: string, en: string) => (l === 'ru' ? ru : l === 'en' ? en : uz), [l]);
}
export const useDateFmt = () => {
  const l = useLocale();
  const loc = l === 'ru' ? 'ru-RU' : l === 'en' ? 'en-GB' : 'uz-UZ';
  return useMemo(() => ({
    date: (d?: string | Date | null) => (d ? new Date(d).toLocaleDateString(loc, { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'),
    dt: (d?: string | Date | null) => (d ? new Date(d).toLocaleString(loc, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'),
    ago: (d?: string | Date | null) => {
      if (!d) return '—';
      const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
      if (m < 1) return l === 'ru' ? 'только что' : l === 'en' ? 'just now' : 'hozir';
      if (m < 60) return l === 'ru' ? `${m} мин назад` : l === 'en' ? `${m} min ago` : `${m} daqiqa oldin`;
      const h = Math.round(m / 60);
      if (h < 24) return l === 'ru' ? `${h} ч назад` : l === 'en' ? `${h} h ago` : `${h} soat oldin`;
      const dd = Math.round(h / 24);
      return l === 'ru' ? `${dd} дн назад` : l === 'en' ? `${dd} d ago` : `${dd} kun oldin`;
    },
  }), [loc, l]);
};

// ---------- toast ----------
type Toast = { id: number; kind: 'ok' | 'err'; text: string };
const ToastCtx = createContext<(kind: 'ok' | 'err', text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((kind: 'ok' | 'err', text: string) => {
    const id = Date.now() + Math.random();
    setList((x) => [...x.slice(-3), { id, kind, text }]);
    setTimeout(() => setList((x) => x.filter((t) => t.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:px-6" aria-live="polite">
        {list.map((t) => (
          <div key={t.id} role="status" className={`pointer-events-auto max-w-sm animate-[fadein_.2s_ease-out] rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${t.kind === 'ok' ? 'bg-primary text-white' : 'bg-red-600 text-white'}`}>{t.text}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ---------- kichik komponentlar ----------
const TONES: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', amber: 'bg-amber-50 text-amber-800 ring-amber-600/20', red: 'bg-red-50 text-red-700 ring-red-600/15',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/15', gray: 'bg-slate-100 text-slate-600 ring-slate-500/10', navy: 'bg-navy/5 text-navy ring-navy/10',
};
export function Badge({ tone = 'gray', children }: { tone?: keyof typeof TONES | string; children: ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONES[tone] ?? TONES.gray}`}>{children}</span>;
}
const PALETTE = ['bg-emerald-100 text-emerald-700', 'bg-sky-100 text-sky-700', 'bg-amber-100 text-amber-700', 'bg-violet-100 text-violet-700', 'bg-rose-100 text-rose-700'];
export function Avatar({ name, size = 'h-9 w-9 text-xs' }: { name: string; size?: string }) {
  const ini = name.split(/\s+/).filter(Boolean).map((x) => x[0]).slice(0, 2).join('').toUpperCase() || '?';
  const c = PALETTE[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % PALETTE.length];
  return <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${c} ${size}`}>{ini}</span>;
}
export function Stars({ n }: { n: number }) {
  return <span aria-label={`${n}/5`} className="whitespace-nowrap text-amber-500">{'★'.repeat(n)}<span className="text-slate-300">{'★'.repeat(5 - n)}</span></span>;
}
export function PageTitle({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0"><h1 className="text-2xl font-extrabold">{title}</h1>{sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}</div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
export function Panel({ title, action, children, className = '' }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-card sm:p-5 ${className}`}>
      {(title || action) && <div className="mb-3 flex items-center justify-between gap-2">{title && <h2 className="text-base font-bold">{title}</h2>}{action}</div>}
      {children}
    </section>
  );
}
export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { v: T; label: string; n?: number }[] }) {
  return (
    <div role="tablist" className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pb-1">
      {items.map((i) => (
        <button key={i.v} role="tab" aria-selected={value === i.v} onClick={() => onChange(i.v)}
          className={`flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${value === i.v ? 'bg-primary text-white shadow-card' : 'bg-white text-navy ring-1 ring-inset ring-[#E5E7EB] hover:bg-canvas'}`}>
          {i.label}{i.n !== undefined && <span className={`rounded-full px-1.5 text-xs ${value === i.v ? 'bg-white/20' : 'bg-navy/5'}`}>{i.n}</span>}
        </button>
      ))}
    </div>
  );
}
export function Skeleton({ rows = 5 }: { rows?: number }) {
  return <div className="space-y-2" aria-busy="true" aria-label="loading">{Array.from({ length: rows }, (_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}</div>;
}
export function EmptyState({ text, icon = 'folder' }: { text: string; icon?: string }) {
  return <div className="grid place-items-center gap-2 py-14 text-center text-muted"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100"><Icon name={icon} /></span><p className="text-sm">{text}</p></div>;
}
export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const L = useL();
  return (
    <div role="alert" className="grid place-items-center gap-3 py-14 text-center">
      <p className="font-semibold text-red-700">{L("Ma'lumot yuklanmadi", 'Не удалось загрузить данные', 'Could not load data')}</p>
      {onRetry && <button className="btn btn-ghost" onClick={onRetry}>{L('Qayta urinish', 'Повторить', 'Retry')}</button>}
    </div>
  );
}

// ---------- modal / drawer ----------
function useEsc(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open, close]);
}
export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  useEsc(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-navy/50" onClick={onClose} aria-label="close" />
      <div className="relative flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4"><h2 className="text-lg font-bold">{title}</h2><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-canvas" aria-label="close"><Icon name="x" /></button></div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-[#E5E7EB] px-5 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
}
/** Muhim amallar uchun tasdiqlash oynasi. confirmText berilsa, foydalanuvchi shu matnni yozishi shart. */
export function Confirm({ open, onClose, onConfirm, title, text, danger, confirmText, busy, label }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; text: string; danger?: boolean; confirmText?: string; busy?: boolean; label?: string;
}) {
  const L = useL();
  const [typed, setTyped] = useState('');
  useEffect(() => { if (!open) setTyped(''); }, [open]);
  const ok = !confirmText || typed.trim().toLowerCase() === confirmText.toLowerCase();
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<>
      <button className="btn btn-ghost" onClick={onClose}>{L('Bekor qilish', 'Отмена', 'Cancel')}</button>
      <button className={`btn ${danger ? 'bg-red-600 text-white hover:bg-red-700' : 'btn-primary'}`} disabled={!ok || busy} onClick={onConfirm}>{busy ? '…' : label ?? L('Tasdiqlash', 'Подтвердить', 'Confirm')}</button>
    </>}>
      <p className="text-sm text-ink/85">{text}</p>
      {confirmText && (
        <label className="mt-4 block text-sm"><span className="mb-1 block font-semibold">{L('Tasdiqlash uchun yozing:', 'Для подтверждения введите:', 'Type to confirm:')} <code className="rounded bg-slate-100 px-1">{confirmText}</code></span>
          <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus /></label>
      )}
    </Modal>
  );
}
export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEsc(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[55]" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-navy/40" onClick={onClose} aria-label="close" />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#E5E7EB] px-5"><h2 className="truncate text-lg font-bold">{title}</h2><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-canvas" aria-label="close"><Icon name="x" /></button></div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// ---------- jadval holati ----------
export interface TableState { page: number; limit: number; sort: string; dir: 'asc' | 'desc'; q: string; f: Record<string, string> }
export function useTable(init: { sort: string; dir?: 'asc' | 'desc'; limit?: number; f?: Record<string, string> }) {
  const [s, setS] = useState<TableState>({ page: 1, limit: init.limit ?? 10, sort: init.sort, dir: init.dir ?? 'desc', q: '', f: init.f ?? {} });
  const [qInput, setQInput] = useState('');
  useEffect(() => { const t = setTimeout(() => setS((x) => (x.q === qInput.trim() ? x : { ...x, q: qInput.trim(), page: 1 })), 350); return () => clearTimeout(t); }, [qInput]);
  const qs = useMemo(() => {
    const p = new URLSearchParams({ page: String(s.page), limit: String(s.limit), sort: s.sort, dir: s.dir });
    if (s.q) p.set('q', s.q);
    for (const [k, v] of Object.entries(s.f)) if (v) p.set(k, v);
    return p.toString();
  }, [s]);
  return {
    s, qs, qInput, setQInput,
    setPage: (page: number) => setS((x) => ({ ...x, page })),
    setLimit: (limit: number) => setS((x) => ({ ...x, limit, page: 1 })),
    setFilter: (k: string, v: string) => setS((x) => ({ ...x, f: { ...x.f, [k]: v }, page: 1 })),
    toggleSort: (col: string) => setS((x) => (x.sort === col ? { ...x, dir: x.dir === 'asc' ? 'desc' : 'asc' } : { ...x, sort: col, dir: 'asc' })),
    reset: () => { setQInput(''); setS((x) => ({ ...x, page: 1, q: '', f: init.f ?? {} })); },
  };
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-0 flex-1 sm:max-w-sm">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"><Icon name="search" className="h-[18px] w-[18px]" /></span>
      <input className="input !pl-10" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}
export function Select({ value, onChange, label, options, className = '' }: { value: string; onChange: (v: string) => void; label: string; options: [string, string][]; className?: string }) {
  return (
    <select className={`input !w-auto max-w-full ${className}`} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="">{label}</option>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

export function Pagination({ page, pages, total, limit, onPage, onLimit }: { page: number; pages: number; total: number; limit: number; onPage: (p: number) => void; onLimit?: (n: number) => void }) {
  const L = useL();
  const nums = useMemo(() => {
    const out: (number | '…')[] = [];
    for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) out.push(i); else if (out[out.length - 1] !== '…') out.push('…');
    return out;
  }, [page, pages]);
  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
      <div className="flex items-center gap-3 text-muted">
        {onLimit && (
          <select className="input !h-9 !w-auto !py-0" value={limit} onChange={(e) => onLimit(Number(e.target.value))} aria-label={L("Sahifadagi yozuvlar", 'Записей на странице', 'Rows per page')}>
            {[10, 20, 50].map((n) => <option key={n} value={n}>{n} {L("ta ko'rsatish", 'на странице', 'per page')}</option>)}
          </select>
        )}
        <span>{L('Jami', 'Всего', 'Total')}: <b className="text-navy">{total}</b></span>
      </div>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button className="btn btn-ghost !h-9 !px-3" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="prev">‹</button>
        {nums.map((n, i) => n === '…' ? <span key={`e${i}`} className="px-1 text-muted">…</span> : (
          <button key={n} aria-current={n === page ? 'page' : undefined} onClick={() => onPage(n)} className={`btn !h-9 !min-w-9 !px-2 ${n === page ? 'btn-primary' : 'btn-ghost'}`}>{n}</button>
        ))}
        <button className="btn btn-ghost !h-9 !px-3" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="next">›</button>
      </nav>
    </div>
  );
}

export interface Col<T> { key: string; label: string; sort?: string; className?: string; render: (r: T) => ReactNode }
/** Bir xil jadval: kompyuterda jadval, telefonda `card` berilsa kartalar. */
export function DataTable<T extends { id: string }>({ cols, rows, loading, error, onRetry, empty, sort, dir, onSort, selected, onSelect, card, onRow }: {
  cols: Col<T>[]; rows: T[] | undefined; loading?: boolean; error?: boolean; onRetry?: () => void; empty: string;
  sort?: string; dir?: 'asc' | 'desc'; onSort?: (col: string) => void; selected?: Set<string>; onSelect?: (s: Set<string>) => void; card?: (r: T) => ReactNode; onRow?: (r: T) => void;
}) {
  if (error) return <ErrorState onRetry={onRetry} />;
  if (loading && !rows) return <Skeleton />;
  if (!rows?.length) return <EmptyState text={empty} />;
  const all = !!selected && rows.every((r) => selected.has(r.id));
  const toggleAll = () => onSelect?.(all ? new Set() : new Set(rows.map((r) => r.id)));
  const toggle = (id: string) => { const n = new Set(selected); if (n.has(id)) n.delete(id); else n.add(id); onSelect?.(n); };
  return (
    <div className={loading ? 'opacity-60 transition' : 'transition'}>
      {card && (
        <ul className="space-y-3 md:hidden">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
              {selected && <label className="mb-2 flex items-center gap-2 text-xs text-muted"><input type="checkbox" className="h-4 w-4 accent-[#087F5B]" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />✓</label>}
              {card(r)}
            </li>
          ))}
        </ul>
      )}
      <div className={`${card ? 'hidden md:block' : ''} overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-white`}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[#E5E7EB] bg-slate-50/70 text-xs uppercase tracking-wide text-muted">
            <tr>
              {selected && <th className="w-10 px-4 py-3"><input type="checkbox" className="h-4 w-4 accent-[#087F5B]" checked={all} onChange={toggleAll} aria-label="all" /></th>}
              {cols.map((c) => (
                <th key={c.key} className={`px-4 py-3 font-semibold ${c.className ?? ''}`} aria-sort={c.sort && sort === c.sort ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {c.sort && onSort ? <button className="inline-flex items-center gap-1 uppercase hover:text-navy" onClick={() => onSort(c.sort!)}>{c.label}<span aria-hidden className="text-[10px]">{sort === c.sort ? (dir === 'asc' ? '▲' : '▼') : '↕'}</span></button> : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {rows.map((r) => (
              <tr key={r.id} className={`transition hover:bg-slate-50/70 ${onRow ? 'cursor-pointer' : ''}`} onClick={() => onRow?.(r)}>
                {selected && <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="h-4 w-4 accent-[#087F5B]" checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label="select" /></td>}
                {cols.map((c) => <td key={c.key} className={`px-4 py-3 align-middle ${c.className ?? ''}`}>{c.render(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function IconBtn({ icon, label, onClick, tone = '', href }: { icon: string; label: string; onClick?: () => void; tone?: string; href?: string }) {
  const cls = `grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-navy ${tone}`;
  return href
    ? <a className={cls} href={href} target="_blank" rel="noopener noreferrer" title={label} aria-label={label}><Icon name={icon} className="h-[18px] w-[18px]" /></a>
    : <button type="button" className={cls} onClick={(e) => { e.stopPropagation(); onClick?.(); }} title={label} aria-label={label}><Icon name={icon} className="h-[18px] w-[18px]" /></button>;
}

// ---------- statistika kartasi va grafiklar ----------
export function StatCard({ icon, label, value, tone = 'text-primary bg-accent' }: { icon: string; label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-card">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}><Icon name={icon} /></span>
      <div className="min-w-0"><p className="font-head text-2xl font-extrabold leading-none text-navy">{value}</p><p className="mt-1 truncate text-xs text-muted">{label}</p></div>
    </div>
  );
}

/** Chiziqli grafik (SVG, ekranga moslashadi) */
export function LineChart({ data, color = '#087F5B', label }: { data: { day: string; n: number }[]; color?: string; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const W = 600, H = 180, P = 8;
  const max = Math.max(1, ...data.map((d) => d.n));
  const x = (i: number) => P + (i * (W - 2 * P)) / Math.max(1, data.length - 1);
  const y = (n: number) => H - P - (n / max) * (H - 2 * P - 10);
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.n).toFixed(1)}`).join(' ');
  const area = `${path} L${x(data.length - 1)},${H - P} L${x(0)},${H - P} Z`;
  const gid = useMemo(() => `g${Math.random().toString(36).slice(2, 8)}`, []);
  const move = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect(); if (!r || !data.length) return;
    setHover(Math.max(0, Math.min(data.length - 1, Math.round(((e.clientX - r.left) / r.width) * (data.length - 1)))));
  };
  const h = hover !== null ? data[hover] : null;
  return (
    <div className="relative">
      <svg ref={ref} role="img" aria-label={label} viewBox={`0 0 ${W} ${H}`} className="h-44 w-full touch-pan-y" onPointerMove={move} onPointerLeave={() => setHover(null)}>
        <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".25" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        {[0, 0.5, 1].map((t) => <line key={t} x1={P} x2={W - P} y1={y(max * t)} y2={y(max * t)} stroke="#E5E7EB" strokeDasharray="3 4" />)}
        {data.length > 1 && <><path d={area} fill={`url(#${gid})`} /><path d={path} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" /></>}
        {hover !== null && <><line x1={x(hover)} x2={x(hover)} y1={P} y2={H - P} stroke={color} strokeOpacity=".3" /><circle cx={x(hover)} cy={y(data[hover].n)} r="4.5" fill="#fff" stroke={color} strokeWidth="2.4" /></>}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-muted"><span>{data[0]?.day.slice(5)}</span><span>max {max}</span><span>{data[data.length - 1]?.day.slice(5)}</span></div>
      {h && <div className="pointer-events-none absolute right-1 top-0 rounded-lg bg-navy px-2.5 py-1 text-xs font-semibold text-white">{h.day}: {h.n}</div>}
    </div>
  );
}

export function Donut({ parts, center, sub }: { parts: { label: string; n: number; color: string }[]; center: ReactNode; sub: string }) {
  const total = parts.reduce((a, p) => a + p.n, 0);
  const R = 52, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label={sub}>
          <circle cx="70" cy="70" r={R} fill="none" stroke="#F1F5F9" strokeWidth="18" />
          {total > 0 && parts.map((p) => {
            const len = (p.n / total) * C; const el = <circle key={p.label} cx="70" cy="70" r={R} fill="none" stroke={p.color} strokeWidth="18" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} />; acc += len; return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center"><div><p className="font-head text-2xl font-extrabold text-navy">{center}</p><p className="text-[11px] text-muted">{sub}</p></div></div>
      </div>
      <ul className="w-full min-w-0 space-y-1.5 text-sm">
        {parts.map((p) => <li key={p.label} className="flex items-center justify-between gap-3"><span className="flex min-w-0 items-center gap-2"><i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} /><span className="truncate">{p.label}</span></span><b className="shrink-0 text-navy">{total ? Math.round((p.n / total) * 100) : 0}%</b></li>)}
      </ul>
    </div>
  );
}
