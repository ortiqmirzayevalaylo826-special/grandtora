'use client';
import { useAuth } from '@/lib/auth';
import UserAvatar from './UserAvatar';
import { Icon } from './ui';

/** Chap menyu sarlavhasi: yashil gradientda rasm, ism, email, yopish tugmasi (shaxsiy_yordamchi uslubi). */
export default function DrawerHead({ onClose, badge }: { onClose: () => void; badge?: string }) {
  const { user } = useAuth();
  if (!user) return null;
  const name = `${user.firstName} ${user.lastName}`.trim() || user.email;
  return (
    <div className="flex items-center gap-3 bg-gradient-to-br from-[#064E3B] to-[#087F5B] px-4 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] text-white">
      <span className="rounded-full ring-2 ring-white/60"><UserAvatar user={user} /></span>
      <div className="min-w-0 flex-1"><b className="block truncate text-[17px]">{name}</b><small className="block truncate text-white/85">{user.email}</small>{badge && <span className="mt-1 inline-block rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">{badge}</span>}</div>
      <button className="grid h-10 w-10 place-items-center rounded-xl hover:bg-white/15" onClick={onClose} aria-label="close"><Icon name="x" /></button>
    </div>
  );
}
