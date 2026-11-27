'use client';
import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { Empty, ErrorBox, PageHead, Spinner } from '@/components/ui';
import { Tabs, useL } from '@/components/admin/kit';
import NoteItem from '@/components/NoteItem';
import { Group, useInbox } from '@/components/useInbox';

type Tab = 'all' | 'unread' | Group;

/** Bildirishnomalar: filtr bo'limlari (hammasi / o'qilmagan / eslatmalar / xabarlar / maslahatlar). Bosilsa tegishli sahifaga o'tadi, e'lon bo'lsa matni ochiladi. */
export default function Notifications() {
  const L = useL();
  const inbox = useInbox({ list: true });
  const [tab, setTab] = useState<Tab>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  if (inbox.loading) return <Spinner />;
  if (inbox.error) return <ErrorBox code={inbox.error} onRetry={inbox.reload} />;
  const sorted = [...inbox.items].sort((a, b) => Number(a.read) - Number(b.read) || (b.at ?? '9').localeCompare(a.at ?? '9'));
  const count = (g: Group) => inbox.items.filter((i) => i.group === g).length;
  const rows = sorted.filter((i) => tab === 'all' || (tab === 'unread' ? !i.read : i.group === tab));
  return (
    <div>
      <PageHead title={L('Bildirishnomalar', 'Уведомления', 'Notifications')}>
        <div className="flex gap-2">
          {inbox.unread > 0 && <button className="btn btn-ghost" onClick={inbox.readAll}>{L("Hammasini o'qilgan deb belgilash", 'Прочитать все', 'Mark all read')}</button>}
          <Link href="/app/settings" className="btn btn-ghost">{L('Sozlamalar', 'Настройки', 'Settings')}</Link>
        </div>
      </PageHead>
      <Tabs<Tab> value={tab} onChange={setTab} items={[
        { v: 'all', label: L('Hammasi', 'Все', 'All'), n: inbox.items.length },
        { v: 'unread', label: L("O'qilmagan", 'Непрочитанные', 'Unread'), n: inbox.items.filter((i) => !i.read).length },
        { v: 'reminder', label: L('Eslatmalar', 'Напоминания', 'Reminders'), n: count('reminder') },
        { v: 'message', label: L('Xabarlar', 'Сообщения', 'Messages'), n: count('message') },
        { v: 'tip', label: L('Maslahatlar', 'Советы', 'Tips'), n: count('tip') },
        { v: 'system', label: L('Tizim', 'Система', 'System'), n: count('system') },
      ]} />
      {rows.length === 0 ? <Empty text={L("Bu bo'limda xabar yo'q", 'В этом разделе пусто', 'Nothing here')} /> : (
        <ul className="card divide-y divide-navy/5 p-2">
          {rows.map((it) => (
            <li key={it.key}>
              <NoteItem it={it} expanded={openId === it.key} trailing={it.link ? '→' : openId === it.key ? '▴' : '▾'}
                onClick={() => { if (it.link) inbox.open(it); else { inbox.mark(it); setOpenId(openId === it.key ? null : it.key); } }} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
