'use client';
import { PageTitle, useL } from '@/components/admin/kit';
import { Guide, GuideItem } from '@/components/Guide';

export default function AdminGuide() {
  const L = useL();
  const items: GuideItem[] = [
    { icon: 'chart', title: L('Statistika', 'Статистика', 'Statistics'), steps: [
      L("Yuqoridagi kartalar real bazadan olinadi: foydalanuvchilar, grantlar, saqlashlar, arizalar.", 'Карточки сверху считаются по реальной базе: пользователи, гранты, сохранения, заявки.', 'The cards come straight from the database: users, grants, saves, applications.'),
      L("Davrni (7/30/90 kun) o'zgartirsangiz, grafiklar shunga moslashadi. Ma'lumot bo'lmasa, bo'sh holat ko'rsatiladi — soxta raqam yo'q.", 'Смена периода (7/30/90 дней) перестраивает графики. Если данных нет, показывается пустое состояние — без выдуманных цифр.', 'Changing the period (7/30/90 days) updates the charts. With no data you see an empty state, never fake numbers.'),
    ] },
    { icon: 'list', title: L('Grantlar', 'Гранты', 'Grants'), steps: [
      L("«Grant qo'shish» orqali yangi grant yarating: avval qoralama (Draft) sifatida saqlang, tekshirib, «Nashr qilish» ni bosing.", 'Создайте грант через «Добавить грант»: сначала сохраните как черновик, проверьте и нажмите «Опубликовать».', 'Create a grant via “Add grant”: save as Draft first, review, then Publish.'),
      L("Jadvalda qidiring, davlat/daraja/holat bo'yicha filtrlang, ustun nomini bosib saralang. Bir nechta grantni belgilab, ommaviy nashr/arxiv/o'chirish mumkin.", 'Ищите, фильтруйте по стране/уровню/статусу, сортируйте по заголовку колонки. Отметив несколько грантов, можно массово публиковать/архивировать/удалять.', 'Search, filter by country/level/status and sort by column. Select several grants for bulk publish/archive/delete.'),
      L("O'chirish qaytarib bo'lmaydi: avval «Arxivlash» ni ishlating.", 'Удаление необратимо: сначала используйте «В архив».', 'Deleting is permanent: prefer Archive.'),
    ] },
    { icon: 'users', title: L('Foydalanuvchilar', 'Пользователи', 'Users'), steps: [
      L("Qatorni bossangiz, profil paneli ochiladi: ma'lumotlar, saqlanganlar, arizalar, faollik tarixi.", 'Клик по строке открывает профиль: данные, избранное, заявки, история активности.', 'Click a row to open the profile: details, saved grants, applications, activity.'),
      L("Bloklangan foydalanuvchi kira olmaydi va barcha sessiyalari yopiladi. Hisobni o'chirish uchun email'ni qayta yozish talab qilinadi.", 'Заблокированный пользователь не может войти, все сессии закрываются. Для удаления аккаунта нужно ввести его email.', 'A blocked user cannot sign in and all sessions close. Deleting an account requires typing its email.'),
    ] },
    { icon: 'alert', title: L("Shikoyatlar (foydalanuvchilar o'rtasidagi muammolar)", 'Жалобы (проблемы между пользователями)', 'Complaints (issues between users)'), steps: [
      L("Talabalar «Qo'llanma va yordam → Shikoyat yuborish» orqali shikoyat yuboradi. U shu yerda «Yangi» holatida chiqadi.", 'Студенты подают жалобу через «Руководство и помощь → Подать жалобу». Она появляется здесь как «Новая».', 'Students file complaints under “Guide & help → File a complaint”; they appear here as New.'),
      L("Shikoyatni oching, «Ko'rib chiqishni boshlash»ni bosing, ikkala tomonni (shikoyatchi va kimga qarshi) ko'ring. Kerak bo'lsa, shu yerning o'zidan foydalanuvchini bloklang yoki sharhlar bo'limiga o'ting.", 'Откройте жалобу, нажмите «Взять в работу», изучите обе стороны. При необходимости заблокируйте пользователя прямо отсюда или перейдите к отзывам.', 'Open it, press “Start review”, check both parties. If needed block the user right here or jump to Reviews.'),
      L("Qaror matnini yozib «Hal qilindi» yoki «Rad etish»ni bosing — shikoyatchiga bildirishnoma boradi. Hamma amal audit jurnaliga yoziladi.", 'Напишите решение и нажмите «Решено» или «Отклонить» — заявитель получит уведомление. Всё записывается в журнал аудита.', 'Write the resolution and press Resolved or Dismiss; the reporter is notified. Everything is audit-logged.'),
    ] },
    { icon: 'msg', title: L('Xabarlar va murojaatlar', 'Сообщения и обращения', 'Messages and inquiries'), steps: [
      L("«Xabarlar» — talabalar bilan chat; «Umumiy e'lon» barcha faol talabalarga bildirishnoma yuboradi.", '«Сообщения» — чат со студентами; «Общее объявление» отправляет уведомление всем активным студентам.', 'Messages is a chat with students; Broadcast notifies every active student.'),
      L("«Murojaatlar» — aloqa formasi orqali kelganlar: holat, muhimlik, mas'ul belgilang va emailga javob yozing.", '«Обращения» — сообщения из формы контактов: задайте статус, важность, ответственного и ответьте по email.', 'Inquiries come from the contact form: set status, priority, assignee and reply by email.'),
    ] },
    { icon: 'star', title: L('Sharhlar', 'Отзывы', 'Reviews'), steps: [
      L("Faqat «Tasdiqlangan» sharhlar ochiq saytda ko'rinadi. Nojo'ya sharhni «Rad etish» yoki «Yashirish» qiling.", 'На сайте видны только «Одобренные» отзывы. Неподобающие — «Отклонить» или «Скрыть».', 'Only Approved reviews appear on the site. Reject or Hide inappropriate ones.'),
    ] },
    { icon: 'refresh', title: L('Yangilik tekshiruvi', 'Проверка актуальности', 'Freshness check'), steps: [
      L("Rasmiy havolani oching, ma'lumot dolzarbligini o'zingiz tekshiring va holatni belgilang. Hech narsa avtomatik tasdiqlanmaydi.", 'Откройте официальную ссылку, проверьте актуальность сами и отметьте статус. Автоматически ничего не подтверждается.', 'Open the official link, verify accuracy yourself and set the status. Nothing is auto-verified.'),
    ] },
    { icon: 'globe', title: L('Davlat va kategoriyalar', 'Страны и категории', 'Countries and categories'), steps: [
      L("Davlat, kategoriya qo'shish/tahrirlash va davlatni katalogda faol/nofaol qilish shu yerda. Bu ro'yxatlar ochiq katalogdagi filtrlarni boshqaradi.", 'Здесь добавляются/редактируются страны и категории, страны включаются/отключаются в каталоге. Эти списки питают фильтры публичного каталога.', 'Add/edit countries and categories and toggle countries in the catalog. These lists drive the public filters.'),
    ] },
    { icon: 'log', title: L('Audit jurnali', 'Журнал аудита', 'Audit log'), steps: [
      L("Adminlarning muhim amallari (kim, qachon, nima, IP, natija) yoziladi. Sana, admin, bo'lim va natija bo'yicha filtrlang, CSV yuklab oling.", 'Записываются важные действия админов (кто, когда, что, IP, результат). Фильтруйте по дате, админу, разделу и результату, скачивайте CSV.', 'Significant admin actions are logged (who, when, what, IP, result). Filter by date, admin, section and result; export CSV.'),
    ] },
    { icon: 'download', title: L("Ilova va til", 'Приложение и язык', 'App and language'), steps: [
      L("Yuqoridagi «Ilovani o'rnatish» tugmasi va til tanlagich har bir sahifada turadi. Admin panel telefonda ham to'liq ishlaydi.", 'Кнопка установки и выбор языка всегда в верхней панели. Админ-панель полностью работает и на телефоне.', 'The install button and language picker stay in the top bar. The admin panel works fully on phones.'),
    ] },
  ];
  return (
    <div>
      <PageTitle title={L("Admin qo'llanmasi", 'Руководство администратора', 'Admin guide')} sub={L('Har bir bo‘lim nima qilishi va qanday ishlatilishi', 'Что делает каждый раздел и как им пользоваться', 'What each section does and how to use it')} />
      <Guide items={items} />
    </div>
  );
}
