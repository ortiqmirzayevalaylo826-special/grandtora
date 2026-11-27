/** Davlat bayrog'i (flagcdn.com). Windows'da bayroq emojilari ko'rinmaydi, shuning uchun rasm. */
const MAP: Record<string, string> = { UK: 'gb' };
export default function Flag({ code, className = 'h-5 w-7' }: { code: string; className?: string }) {
  const c = (MAP[code] ?? code).toLowerCase();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`https://flagcdn.com/w40/${c}.png`} srcSet={`https://flagcdn.com/w80/${c}.png 2x`} alt="" loading="lazy" width={28} height={20}
      className={`${className} rounded-[3px] border border-navy/10 object-cover`} />
  );
}
