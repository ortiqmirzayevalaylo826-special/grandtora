import { BRAND } from '@/brand';

export default function Logo({ light = false, className = '' }: { light?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/logo-mark.png" alt="" width={36} height={38} className="h-9 w-auto" />
      <span className={`font-head text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-navy'}`}>{BRAND.name}</span>
    </span>
  );
}
