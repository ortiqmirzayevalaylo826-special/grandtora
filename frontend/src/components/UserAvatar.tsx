'use client';
import { useState } from 'react';
import { AuthUser } from '@/lib/auth';

/** Foydalanuvchi rasmi: yuklangan bo'lsa shu, bo'lmasa ism bosh harfi. `v` — keshni yangilash uchun. */
export default function UserAvatar({ user, size = 'h-9 w-9 text-sm', className = '' }: { user: Pick<AuthUser, 'firstName' | 'email' | 'avatar'>; size?: string; className?: string }) {
  const [bad, setBad] = useState<string | null>(null);
  const initial = (user.firstName?.[0] ?? user.email?.[0] ?? '?').toUpperCase();
  if (user.avatar && bad !== user.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/api/me/avatar?v=${user.avatar}`} alt="" onError={() => setBad(user.avatar ?? null)} className={`${size} shrink-0 rounded-full object-cover ${className}`} />;
  }
  return <span className={`grid ${size} shrink-0 place-items-center rounded-full bg-primary font-bold text-white ${className}`}>{initial}</span>;
}
