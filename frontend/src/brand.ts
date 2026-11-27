// Brend nomi BITTA joyda. O'zgartirsangiz butun sayt yangilanadi.
export const BRAND = { name: 'Grantora', tagline: { uz: "Dunyo bo'ylab grantlar", ru: 'Гранты со всего мира', en: 'Grants from around the world' } } as const;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** Aloqa ma'lumotlari: Render'da NEXT_PUBLIC_* o'zgaruvchilari bilan beriladi. Bo'sh bo'lsa sahifada ko'rsatilmaydi (soxta ma'lumot yozilmaydi). */
export const CONTACT = {
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '',
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '',
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS ?? '',
};
export const SOCIAL = [
  { name: 'Telegram', href: process.env.NEXT_PUBLIC_SOCIAL_TELEGRAM ?? '' },
  { name: 'Instagram', href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? '' },
  { name: 'YouTube', href: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE ?? '' },
  { name: 'LinkedIn', href: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN ?? '' },
].filter((s) => s.href);
