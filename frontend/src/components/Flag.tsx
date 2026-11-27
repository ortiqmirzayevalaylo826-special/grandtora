/** Davlat bayrog'i: tashqi saytga bog'liq emas, hammasi SVG (28x20). Noma'lum kod uchun kulrang belgi. */
import type { ReactNode } from 'react';

const star = (cx: number, cy: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.4 : r;
    return `${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`;
  }).join(' ');

const FLAGS: Record<string, ReactNode> = {
  DE: <><rect width="28" height="7" fill="#000" /><rect y="6.67" width="28" height="6.67" fill="#D00" /><rect y="13.33" width="28" height="6.67" fill="#FFCE00" /></>,
  FR: <><rect width="9.34" height="20" fill="#0055A4" /><rect x="9.33" width="9.34" height="20" fill="#fff" /><rect x="18.66" width="9.34" height="20" fill="#EF4135" /></>,
  IT: <><rect width="9.34" height="20" fill="#009246" /><rect x="9.33" width="9.34" height="20" fill="#fff" /><rect x="18.66" width="9.34" height="20" fill="#CE2B37" /></>,
  NL: <><rect width="28" height="6.67" fill="#AE1C28" /><rect y="6.67" width="28" height="6.67" fill="#fff" /><rect y="13.33" width="28" height="6.67" fill="#21468B" /></>,
  PL: <><rect width="28" height="10" fill="#fff" /><rect y="10" width="28" height="10" fill="#DC143C" /></>,
  JP: <><rect width="28" height="20" fill="#fff" /><circle cx="14" cy="10" r="6" fill="#BC002D" /></>,
  TR: <><rect width="28" height="20" fill="#E30A17" /><circle cx="10.5" cy="10" r="5" fill="#fff" /><circle cx="11.9" cy="10" r="4" fill="#E30A17" /><polygon points={star(16.2, 10, 2.4)} fill="#fff" /></>,
  CA: <><rect width="28" height="20" fill="#fff" /><rect width="7" height="20" fill="#D52B1E" /><rect x="21" width="7" height="20" fill="#D52B1E" /><path d="M14 4l1.4 3 2-.8-.8 4.4 2.2-1.6.6 1.4-3.6 3 .4 1.2-2.2-.4V17h-.4v-3.8l-2.2.4.4-1.2-3.6-3 .6-1.4 2.2 1.6-.8-4.4 2 .8z" fill="#D52B1E" /></>,
  KR: <><rect width="28" height="20" fill="#fff" /><path d="M9.5 10a4.5 4.5 0 0 1 9 0z" fill="#CD2E3A" /><path d="M9.5 10a4.5 4.5 0 0 0 9 0z" fill="#0047A0" /><g stroke="#000" strokeWidth="1"><path d="M3.5 4l3-1.8M4.5 5.6l3-1.8M2.6 2.7l3-1.8M21.5 18l3-1.8M20.5 16.4l3-1.8M22.4 17.3l3-1.8" /></g></>,
  GB: <><rect width="28" height="20" fill="#012169" /><path d="M0 0l28 20M28 0L0 20" stroke="#fff" strokeWidth="4" /><path d="M0 0l28 20M28 0L0 20" stroke="#C8102E" strokeWidth="1.6" /><path d="M14 0v20M0 10h28" stroke="#fff" strokeWidth="6.5" /><path d="M14 0v20M0 10h28" stroke="#C8102E" strokeWidth="3.6" /></>,
  US: <>
    <rect width="28" height="20" fill="#fff" />
    {[0, 2, 4, 6, 8, 10, 12].map((i) => <rect key={i} y={i * 1.538} width="28" height="1.538" fill="#B22234" />)}
    <rect width="12" height="10.77" fill="#3C3B6E" />
    {[[2, 2], [4.5, 2], [7, 2], [9.5, 2], [3.2, 4], [5.7, 4], [8.2, 4], [2, 6], [4.5, 6], [7, 6], [9.5, 6], [3.2, 8], [5.7, 8], [8.2, 8]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r=".55" fill="#fff" />)}
  </>,
  EU: <><rect width="28" height="20" fill="#003399" />{Array.from({ length: 12 }, (_, i) => { const a = (Math.PI / 6) * i; return <circle key={i} cx={14 + 6 * Math.cos(a)} cy={10 + 6 * Math.sin(a)} r="1" fill="#FFCC00" />; })}</>,
  AU: <><rect width="28" height="20" fill="#012169" /><path d="M7 0v10M0 5h14" stroke="#fff" strokeWidth="3.4" /><path d="M7 0v10M0 5h14" stroke="#C8102E" strokeWidth="2" /><polygon points={star(21, 14, 2.4)} fill="#fff" /><polygon points={star(7, 15, 2.2)} fill="#fff" /></>,
  CN: <><rect width="28" height="20" fill="#DE2910" /><polygon points={star(5, 5, 3)} fill="#FFDE00" /></>,
  RU: <><rect width="28" height="6.67" fill="#fff" /><rect y="6.67" width="28" height="6.67" fill="#0039A6" /><rect y="13.33" width="28" height="6.67" fill="#D52B1E" /></>,
  ES: <><rect width="28" height="20" fill="#AA151B" /><rect y="5" width="28" height="10" fill="#F1BF00" /></>,
  SE: <><rect width="28" height="20" fill="#006AA7" /><rect x="8" width="4" height="20" fill="#FECC00" /><rect y="8" width="28" height="4" fill="#FECC00" /></>,
  CH: <><rect width="28" height="20" fill="#D52B1E" /><rect x="12" y="4" width="4" height="12" fill="#fff" /><rect x="8" y="8" width="12" height="4" fill="#fff" /></>,
  AT: <><rect width="28" height="6.67" fill="#ED2939" /><rect y="6.67" width="28" height="6.67" fill="#fff" /><rect y="13.33" width="28" height="6.67" fill="#ED2939" /></>,
  HU: <><rect width="28" height="6.67" fill="#CE2939" /><rect y="6.67" width="28" height="6.67" fill="#fff" /><rect y="13.33" width="28" height="6.67" fill="#477050" /></>,
  AE: <><rect width="28" height="20" fill="#fff" /><rect width="28" height="6.67" fill="#00732F" /><rect y="13.33" width="28" height="6.67" fill="#000" /><rect width="7" height="20" fill="#FF0000" /></>,
  UZ: <><rect width="28" height="6.67" fill="#0099B5" /><rect y="6.67" width="28" height="6.66" fill="#fff" /><rect y="13.33" width="28" height="6.67" fill="#1EB53A" /><rect y="6.2" width="28" height=".6" fill="#CE1126" /><rect y="13.2" width="28" height=".6" fill="#CE1126" /></>,
};
const ALIAS: Record<string, string> = { UK: 'GB' };

export default function Flag({ code, className = 'h-5 w-7' }: { code: string; className?: string }) {
  const raw = (code ?? '').toUpperCase();
  const c = ALIAS[raw] ?? raw;
  const body = FLAGS[c];
  return (
    <svg role="img" aria-label={c} viewBox="0 0 28 20" preserveAspectRatio="xMidYMid slice"
      className={`${className} shrink-0 overflow-hidden rounded-[3px] border border-navy/10 bg-canvas`}>
      {body ?? <><rect width="28" height="20" fill="#E2E8E5" /><text x="14" y="13.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="#75847D">{c.slice(0, 2)}</text></>}
    </svg>
  );
}
