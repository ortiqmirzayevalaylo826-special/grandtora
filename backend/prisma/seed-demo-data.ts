/**
 * DEMO kontent (kurs loyihasi taqdimoti uchun): ko'p talaba, ariza, sharh, shikoyat, murojaat, chat, bildirishnoma,
 * ko'rishlar statistikasi va audit yozuvlari — admin va talaba kabinetlari "jonli" ko'rinishi uchun.
 * Barchasi SOXTA (taqdimot uchun). seed-demo.ts oxirida chaqiriladi; takroran ishga tushirsa ikkilanmaydi.
 */
import { PrismaClient, StudyLevel, FundingType } from '@prisma/client';

const day = (n: number) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
const ago = (min: number) => new Date(Date.now() - min * 60_000);
const agoDays = (n: number, h = 10) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, 17, 0, 0); return d; };

const CN: Record<string, [string, string, string]> = {
  DE: ['Germaniya', 'Германии', 'Germany'], UK: ['Buyuk Britaniya', 'Великобритании', 'the UK'], US: ['AQSH', 'США', 'the USA'], TR: ['Turkiya', 'Турции', 'Türkiye'],
  KR: ['Janubiy Koreya', 'Южной Корее', 'South Korea'], JP: ['Yaponiya', 'Японии', 'Japan'], HU: ['Vengriya', 'Венгрии', 'Hungary'], FR: ['Fransiya', 'Франции', 'France'],
  CN: ['Xitoy', 'Китае', 'China'], SE: ['Shvetsiya', 'Швеции', 'Sweden'], PL: ['Polsha', 'Польше', 'Poland'], IT: ['Italiya', 'Италии', 'Italy'], NL: ['Niderlandiya', 'Нидерландах', 'the Netherlands'], CA: ['Kanada', 'Канаде', 'Canada'],
};
// slug, tashkilot, davlat, darajalar, moliyalashtirish, ielts, gpa, muddat(kun), url, sarlavha
const EXTRA: [string, string, string, StudyLevel[], FundingType, number | null, number | null, number, string, string][] = [
  ['swedish-institute-scholarships', 'Swedish Institute', 'SE', ['MASTER'], 'FULL', 6.5, 3.0, 40, 'https://si.se', 'Swedish Institute Scholarships for Global Professionals'],
  ['eiffel-excellence', 'Campus France', 'FR', ['MASTER', 'PHD'], 'FULL', 6.0, 3.3, 55, 'https://www.campusfrance.org', 'Eiffel Excellence Scholarship'],
  ['gks-korea', 'NIIED', 'KR', ['BACHELOR', 'MASTER', 'PHD'], 'FULL', 5.5, 3.0, 25, 'https://www.studyinkorea.go.kr', 'Global Korea Scholarship (GKS)'],
  ['csc-china', 'China Scholarship Council', 'CN', ['BACHELOR', 'MASTER', 'PHD'], 'FULL', null, 3.0, 70, 'https://www.csc.edu.cn', 'Chinese Government Scholarship (CSC)'],
  ['erasmus-mundus-jm', 'European Commission', 'EU', ['MASTER'], 'FULL', 6.5, 3.2, 90, 'https://erasmus-plus.ec.europa.eu', 'Erasmus Mundus Joint Master Degrees'],
  ['gates-cambridge', 'Gates Cambridge Trust', 'UK', ['MASTER', 'PHD'], 'FULL', 7.5, 3.7, 15, 'https://www.gatescambridge.org', 'Gates Cambridge Scholarship'],
  ['rhodes-scholarship', 'Rhodes Trust', 'UK', ['MASTER'], 'FULL', 7.0, 3.7, 100, 'https://www.rhodeshouse.ox.ac.uk', 'Rhodes Scholarship'],
  ['vanier-canada', 'Government of Canada', 'CA', ['PHD'], 'FULL', 6.5, 3.8, 60, 'https://vanier.gc.ca', 'Vanier Canada Graduate Scholarships'],
  ['nuffic-orange-knowledge', 'Nuffic', 'NL', ['MASTER', 'SHORT'], 'PARTIAL', 6.0, 3.0, 35, 'https://www.studyinnl.org', 'Orange Knowledge Programme'],
  ['polish-nawa-welcome', 'NAWA', 'PL', ['MASTER', 'PHD'], 'PARTIAL', 6.0, 3.0, 48, 'https://nawa.gov.pl', 'NAWA Welcome to Poland'],
  ['italian-mae-scholarships', 'Italian MAECI', 'IT', ['BACHELOR', 'MASTER'], 'LIVING', null, 3.0, 65, 'https://studyinitaly.esteri.it', 'Italian Government Scholarships (MAECI)'],
  ['daad-epos', 'DAAD', 'DE', ['MASTER'], 'FULL', 6.5, 3.0, 80, 'https://www.daad.de', 'DAAD Development-Related Postgraduate Courses (EPOS)'],
  ['mext-research', 'MEXT', 'JP', ['MASTER', 'PHD'], 'FULL', 6.0, 3.2, 30, 'https://www.studyinjapan.go.jp', 'MEXT Research Student Scholarship'],
  ['fulbright-uz-teaching', 'Fulbright', 'US', ['SHORT'], 'PARTIAL', 6.0, 3.0, 120, 'https://www.fulbrightprogram.org', 'Fulbright Teaching Excellence Program'],
];

const STUDENTS: { e: string; f: string; l: string; c: string; u: string; fac: string; lvl: StudyLevel; gpa: number; ielts: number | null; by: number; join: number; active: number }[] = [
  { e: 'demo.student3@grantora.demo', f: 'Sardor', l: 'Aliyev', c: 'UZ', u: 'Toshkent davlat texnika universiteti', fac: 'Elektronika', lvl: 'BACHELOR', gpa: 3.4, ielts: 6.0, by: 2003, join: 27, active: 0 },
  { e: 'demo.student4@grantora.demo', f: 'Dilnoza', l: 'Yusupova', c: 'UZ', u: "O'zbekiston davlat jahon tillari universiteti", fac: 'Filologiya', lvl: 'MASTER', gpa: 3.8, ielts: 7.0, by: 2000, join: 24, active: 1 },
  { e: 'demo.student5@grantora.demo', f: 'Bekzod', l: 'Tursunov', c: 'UZ', u: 'Samarqand davlat universiteti', fac: 'Matematika', lvl: 'MASTER', gpa: 3.6, ielts: 6.5, by: 2001, join: 21, active: 0 },
  { e: 'demo.student6@grantora.demo', f: 'Malika', l: 'Nazarova', c: 'UZ', u: 'Andijon davlat tibbiyot instituti', fac: 'Davolash ishi', lvl: 'MASTER', gpa: 3.9, ielts: 7.5, by: 1999, join: 18, active: 2 },
  { e: 'demo.student7@grantora.demo', f: 'Javlon', l: 'Ergashev', c: 'UZ', u: 'Namangan muhandislik-qurilish instituti', fac: 'Qurilish', lvl: 'BACHELOR', gpa: 3.1, ielts: null, by: 2004, join: 15, active: 3 },
  { e: 'demo.student8@grantora.demo', f: 'Nilufar', l: 'Qodirova', c: 'UZ', u: 'Toshkent axborot texnologiyalari universiteti', fac: "Sun'iy intellekt", lvl: 'MASTER', gpa: 3.7, ielts: 7.0, by: 2000, join: 12, active: 0 },
  { e: 'demo.student9@grantora.demo', f: 'Otabek', l: 'Mirzayev', c: 'UZ', u: "Farg'ona davlat universiteti", fac: 'Fizika', lvl: 'PHD', gpa: 3.5, ielts: 6.5, by: 1997, join: 9, active: 1 },
  { e: 'demo.student10@grantora.demo', f: 'Shahnoza', l: 'Rahimova', c: 'UZ', u: 'Buxoro davlat universiteti', fac: 'Iqtisodiyot', lvl: 'BACHELOR', gpa: 3.3, ielts: 6.0, by: 2002, join: 6, active: 0 },
];

/** Soxta, lekin to'g'ri tuzilgan kichik PDF (admin hujjatni yuklab ko'rsatishi uchun). */
const pdf = (title: string) => Buffer.from(`%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 120]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 60>>stream\nBT /F1 14 Tf 20 60 Td (${title.replace(/[()\\]/g, '')} - DEMO) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R/Size 6>>\n%%EOF\n`, 'latin1');

export async function demoContent(db: PrismaClient, passwordHash: string) {
  // ---- 1. Qo'shimcha demo grantlar ----
  const docsUz = ['Pasport nusxasi', 'Diplom yoki transkript', 'Motivatsion xat', 'Tavsiya xatlari (2 ta)', 'CV (rezyume)', 'Til sertifikati'];
  for (const [slug, org, c, levels, funding, ielts, gpa, dl, url, title] of EXTRA) {
    const [uz, ru, en] = CN[c] ?? ['Yevropa', 'Европе', 'Europe'];
    await db.scholarship.upsert({
      where: { slug }, update: {},
      create: {
        slug, organization: org, countryCode: c, levels, fields: [], funding, ieltsMin: ielts, gpaMin: gpa, deadline: day(dl), officialUrl: url, status: 'PUBLISHED', isDemo: true,
        featured: dl < 45, publishedAt: new Date(), lastVerifiedAt: agoDays(3), views: 40 + ((slug.length * 37) % 260),
        translations: { create: [
          { locale: 'uz', title, summary: `${org} taklif qiladigan, ${uz}da o'qish uchun demo grant. Haqiqiy shartlarni rasmiy saytdan tekshiring.`, description: `${title} — taqdimot uchun namunaviy yozuv. Dastur shartlari, miqdori va muddatlari rasmiy manbada tekshirilishi kerak.`, eligibility: "O'zbekiston fuqarolari; tegishli darajadagi ta'lim; til sertifikati (talab qilinsa).", documents: docsUz, process: ["Rasmiy saytda ro'yxatdan o'ting", 'Hujjatlarni tayyorlang', 'Onlayn ariza topshiring', 'Suhbat va natijani kuting'] },
          { locale: 'ru', title, summary: `Демонстрационный грант от ${org} для обучения в ${ru}. Реальные условия проверяйте на официальном сайте.`, description: `${title} — демонстрационная запись для презентации.`, eligibility: 'Граждане Узбекистана; соответствующий уровень образования.', documents: ['Копия паспорта', 'Диплом или транскрипт', 'Мотивационное письмо', 'Рекомендательные письма (2)', 'CV', 'Языковой сертификат'], process: ['Зарегистрируйтесь на официальном сайте', 'Подготовьте документы', 'Подайте заявку онлайн', 'Дождитесь результата'] },
          { locale: 'en', title, summary: `A demo scholarship from ${org} for studying in ${en}. Check real terms on the official website.`, description: `${title} — a sample record for the presentation.`, eligibility: 'Citizens of Uzbekistan; relevant education level.', documents: ['Passport copy', 'Diploma or transcript', 'Motivation letter', 'Recommendation letters (2)', 'CV', 'Language certificate'], process: ['Register on the official site', 'Prepare documents', 'Apply online', 'Wait for the result'] },
        ] },
      },
    });
  }
  const grants = await db.scholarship.findMany({ where: { status: 'PUBLISHED' }, select: { id: true, slug: true }, orderBy: { slug: 'asc' } });
  if (grants.length === 0) return;
  const g = (i: number) => grants[i % grants.length];

  // ---- 2. Talabalar ----
  const stored = !process.env.SUPABASE_URL; // hujjat fayllari bazada saqlanadi (Supabase bo'lsa o'tkazib yuboramiz)
  const users: { id: string; f: string; l: string; e: string }[] = [];
  for (const [i, s] of STUDENTS.entries()) {
    const u = await db.user.upsert({
      where: { email: s.e }, update: {},
      create: { email: s.e, passwordHash, role: 'STUDENT', firstName: s.f, lastName: s.l, emailVerifiedAt: agoDays(s.join), createdAt: agoDays(s.join), lastActiveAt: agoDays(s.active, 14),
        profile: { create: { country: s.c, university: s.u, faculty: s.fac, major: s.fac, level: s.lvl, gpa: s.gpa, ielts: s.ielts ?? undefined, birthYear: s.by, languages: ['uz', 'ru', 'en'], interests: 'Dasturlash, tadqiqot, xalqaro almashinuv', achievements: "Fakultet olimpiadasi g'olibi" } } },
    });
    users.push({ id: u.id, f: s.f, l: s.l, e: s.e });
    if ((await db.savedScholarship.count({ where: { userId: u.id } })) === 0) {
      for (const k of [i, i + 2, i + 5]) await db.savedScholarship.upsert({ where: { userId_scholarshipId: { userId: u.id, scholarshipId: g(k).id } }, update: {}, create: { userId: u.id, scholarshipId: g(k).id } });
    }
  }
  const admin = await db.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
  const madina = await db.user.findUnique({ where: { email: 'demo.student1@grantora.demo' } });
  if (madina) users.unshift({ id: madina.id, f: 'Madina', l: 'Karimova', e: madina.email });

  // ---- 3. Arizalar: turli holatlar (admin "Arizalar" bo'limi to'la ko'rinadi) ----
  const REVIEWS: [number, number, string, string | null, string][] = [
    // [talaba indeksi, grant indeksi, review, admin izohi, status]
    [1, 0, 'SUBMITTED', null, 'SUBMITTED'], [2, 1, 'SUBMITTED', null, 'SUBMITTED'], [3, 2, 'IN_REVIEW', null, 'REVIEW'],
    [4, 3, 'NEEDS_INFO', 'Transkriptning ingliz tilidagi tasdiqlangan nusxasini yuklang.', 'SUBMITTED'], [5, 4, 'APPROVED', "Hujjatlaringiz to'liq. Rasmiy saytda arizani topshirishni davom ettiring.", 'ACCEPTED'],
    [6, 5, 'REJECTED', "Dastur PhD talabgorlari uchun, sizning darajangiz mos emas.", 'REJECTED'], [7, 6, 'IN_REVIEW', null, 'REVIEW'], [8, 7, 'SUBMITTED', null, 'SUBMITTED'], [3, 9, 'APPROVED', 'Motivatsion xat juda yaxshi. Omad!', 'ACCEPTED'], [2, 10, 'SUBMITTED', null, 'SUBMITTED'],
  ];
  for (const [ui, gi, review, note, status] of REVIEWS) {
    const u = users[ui]; if (!u) continue;
    const exists = await db.application.findUnique({ where: { userId_scholarshipId: { userId: u.id, scholarshipId: g(gi).id } } });
    if (exists) continue;
    const docIds: string[] = [];
    if (stored) {
      for (const [name, key] of [['CV.pdf', 'cv'], ['Transkript.pdf', 'transcript']]) {
        const storageKey = `demo/${u.id}/${key}-${gi}.pdf`; const data = pdf(`${u.f} ${u.l} ${name}`);
        await db.fileBlob.upsert({ where: { key: storageKey }, update: {}, create: { key: storageKey, mime: 'application/pdf', data } });
        const d = await db.document.create({ data: { userId: u.id, name, mime: 'application/pdf', sizeBytes: data.length, storageKey } });
        docIds.push(d.id);
      }
    }
    await db.application.create({ data: { userId: u.id, scholarshipId: g(gi).id, status: status as any, review: review as any, reviewNote: note, reviewedAt: note ? agoDays(1) : null, reviewedById: note ? admin?.id : null,
      motivation: "Men o'z sohamda chuqur bilim olib, O'zbekistonga qaytib, ta'lim va texnologiya rivojiga hissa qo'shmoqchiman. Ushbu dastur mening maqsadlarimga to'liq mos keladi.", docIds, submittedAt: agoDays(2 + ui), createdAt: agoDays(8 + ui) } });
    if (note) await db.notification.create({ data: { userId: u.id, type: 'ADMIN_MESSAGE', dedupeKey: `demo-app-${u.id}-${gi}`, payload: { kind: 'application', status: review, title: g(gi).slug, body: note } } });
  }
  // Yo'lda yurgan oddiy arizalar (kuzatuv holatlari)
  for (const [ui, gi, st] of [[1, 3, 'PREPARING'], [2, 5, 'INTERESTED'], [4, 6, 'PREPARING'], [5, 8, 'INTERESTED'], [7, 2, 'PREPARING'], [8, 4, 'INTERESTED']] as [number, number, string][]) {
    const u = users[ui]; if (!u) continue;
    await db.application.upsert({ where: { userId_scholarshipId: { userId: u.id, scholarshipId: g(gi).id } }, update: {}, create: { userId: u.id, scholarshipId: g(gi).id, status: st as any } });
  }

  // ---- 4. Sharhlar (har xil holat, admin moderatsiyasi uchun) ----
  const RV: [number, number, number, string, string][] = [
    [1, 0, 5, "Juda foydali ma'lumot, barcha talablar bir joyda. Rahmat!", 'APPROVED'], [2, 1, 4, "Yaxshi tavsif, ammo muddat haqida eslatma ko'proq bo'lsa yaxshi edi.", 'APPROVED'],
    [3, 2, 5, "Hujjatlar ro'yxati aniq, topshirish jarayoni tushunarli bo'ldi.", 'APPROVED'], [4, 3, 3, "Ma'lumot yaxshi, lekin ba'zi shartlar eskirgan ko'rinadi.", 'PENDING'],
    [5, 4, 5, 'Arizamni shu platforma orqali tayyorladim, admin tez javob berdi.', 'PENDING'], [6, 5, 2, "Bu dastur menga mos kelmadi, tavsifda daraja aniq yozilmagan.", 'PENDING'],
    [7, 6, 4, 'Foydali, kalendar eslatmasi qulay.', 'APPROVED'], [8, 7, 1, "Spam reklama matni — saytga aloqasi yo'q.", 'REJECTED'], [2, 8, 5, "Eng yaxshi ma'lumot platformasi!", 'APPROVED'],
  ];
  for (const [ui, gi, stars, text, status] of RV) {
    const u = users[ui]; if (!u) continue;
    if (await db.review.findFirst({ where: { userId: u.id, scholarshipId: g(gi).id } })) continue;
    await db.review.create({ data: { userId: u.id, scholarshipId: g(gi).id, stars, text, status: status as any, createdAt: agoDays(1 + ui) } });
  }

  // ---- 5. Shikoyatlar ----
  const CMP: [number, string, string, string, string, string | null][] = [
    [3, 'GRANT', "Grant muddati noto'g'ri", "Sahifada muddat o'tgan deb ko'rsatilgan, lekin rasmiy saytda hali ochiq.", 'OPEN', null],
    [4, 'REVIEW', 'Haqoratli sharh', "Mening arizam haqida noo'rin sharh yozilgan, iltimos, ko'rib chiqing.", 'REVIEWING', null],
    [5, 'OTHER', 'Hujjat yuklanmayapti', 'PDF yuklayotganimda xato chiqyapti (5 MB dan kichik).', 'RESOLVED', "Muammo hal qilindi: fayl hajmi tekshiruvi to'g'rilandi. Qayta urinib ko'ring."],
    [6, 'GRANT', 'Havola ishlamayapti', 'Rasmiy sayt havolasi 404 xato beryapti.', 'RESOLVED', 'Havola yangilandi, rahmat!'], [7, 'OTHER', 'Takliflar', "Chatga fayl biriktirish imkoni qo'shilsa yaxshi bo'lardi.", 'DISMISSED', "Taklifingiz qayd etildi, kelgusi versiyada ko'rib chiqamiz."],
  ];
  for (const [ui, kind, subject, text, status, res] of CMP) {
    const u = users[ui]; if (!u) continue;
    if (await db.complaint.findFirst({ where: { reporterId: u.id, subject } })) continue;
    await db.complaint.create({ data: { reporterId: u.id, kind, subject, text, status: status as any, resolution: res, resolvedById: res ? admin?.id : null, resolvedAt: res ? agoDays(1) : null, createdAt: agoDays(3 + ui) } });
  }

  // ---- 6. Aloqa murojaatlari (ochiq sayt orqali) ----
  const MSG: [string, string, string, string, string, 'NEW' | 'IN_PROGRESS' | 'ANSWERED' | 'CLOSED', 'LOW' | 'NORMAL' | 'HIGH', string | null][] = [
    ['Gulbahor Saidova', 'gulbahor@example.com', 'Platforma haqida savol', "Salom! Platformadan foydalanish uchun ro'yxatdan o'tish shartmi?", 'general', 'NEW', 'NORMAL', null],
    ['Jahongir Karimov', 'jahongir@example.com', 'Hamkorlik taklifi', "Universitetimiz talabalar uchun grantlar e'lon qilmoqchi. Qanday bog'lanish mumkin?", 'partnership', 'NEW', 'HIGH', null],
    ['Zilola Hasanova', 'zilola@example.com', 'Ariza muddati', 'DAAD arizasi uchun muddat qachongacha?', 'general', 'IN_PROGRESS', 'NORMAL', null],
    ['Rustam Olimov', 'rustam@example.com', 'Texnik muammo', 'Telefonda sahifa ochilmayapti.', 'bug', 'ANSWERED', 'NORMAL', "Salom! Muammoni tekshirdik, endi sahifa ishlashi kerak. Brauzer keshini tozalab ko'ring."],
    ['Sevara Aminova', 'sevara@example.com', 'Rahmat', 'Platforma orqali grant topdim, katta rahmat!', 'feedback', 'CLOSED', 'LOW', 'Rahmat! Omad tilaymiz.'],
  ];
  if ((await db.contactMessage.count({ where: { email: { endsWith: '@example.com' } } })) === 0) {
    for (const [i, [name, email, subject, message, category, stage, priority, reply]] of MSG.entries()) {
      const m = await db.contactMessage.create({ data: { name, email, subject, message, category, stage, priority, status: stage === 'ANSWERED' || stage === 'CLOSED' ? 'RESOLVED' : 'OPEN', createdAt: agoDays(i + 1) } });
      if (reply && admin) await db.ticketReply.create({ data: { messageId: m.id, authorId: admin.id, body: reply, createdAt: agoDays(i) } });
    }
  }

  // ---- 7. Chat (admin ↔ talaba) ----
  if (admin) {
    const CH: [number, [boolean, string, number, boolean][]][] = [
      [2, [[false, 'Assalomu alaykum! Chevening uchun IELTS 6.5 yetarlimi?', 300, true], [true, "Va alaykum assalom! Ha, ko'p yo'nalishlar uchun 6.5 yetarli, lekin yo'nalishingiz talabini grant sahifasidan tekshiring.", 280, true], [false, 'Rahmat, tushunarli!', 30, false]]],
      [3, [[false, 'Hujjatlarni qaysi formatda yuklash kerak?', 600, true], [true, "PDF yoki JPG/PNG, 5 MB gacha. «Hujjatlar» bo'limidan yuklang.", 590, true]]],
      [4, [[false, 'Arizam holatini qayerdan ko\'raman?', 90, false], [false, 'Javob kutyapman, iltimos.', 15, false]]],
      [6, [[true, "Salom! Arizangiz qabul qilindi, rasmiy saytda davom ettiring.", 200, true], [false, 'Katta rahmat!', 190, true]]],
    ];
    for (const [ui, msgs] of CH) {
      const u = users[ui]; if (!u) continue;
      const conv = await db.conversation.upsert({ where: { studentId: u.id }, update: {}, create: { studentId: u.id } });
      if ((await db.chatMessage.count({ where: { conversationId: conv.id } })) > 0) continue;
      for (const [fromAdmin, body, min, read] of msgs) await db.chatMessage.create({ data: { conversationId: conv.id, senderId: fromAdmin ? admin.id : u.id, fromAdmin, body, createdAt: ago(min), readAt: read ? ago(min - 1) : null } });
      await db.conversation.update({ where: { id: conv.id }, data: { lastMessageAt: ago(Math.min(...msgs.map((m) => m[2]))) } });
    }
  }

  // ---- 8. Muammo xabarlari, obunachilar, ko'rishlar statistikasi ----
  if ((await db.problemReport.count()) === 0) {
    for (const [i, t] of ['Havola ochilmayapti', "Muddat noto'g'ri ko'rsatilgan", 'Tavsifda xatolik bor'].entries())
      await db.problemReport.create({ data: { scholarshipId: g(i + 1).id, userId: users[i + 2]?.id, text: t, status: i === 2 ? 'RESOLVED' : 'OPEN', createdAt: agoDays(i + 1) } });
  }
  for (const [i, n] of ['aziza', 'bobur', 'camila', 'davron', 'elmira', 'farhod', 'gulnora', 'hasan'].entries())
    await db.subscriber.upsert({ where: { email: `${n}@example.com` }, update: {}, create: { email: `${n}@example.com`, locale: ['uz', 'ru', 'en'][i % 3], createdAt: agoDays(i * 3) } });
  for (let d = 0; d < 30; d++) {
    const date = new Date(); date.setUTCHours(0, 0, 0, 0); date.setUTCDate(date.getUTCDate() - d);
    const views = 60 + ((d * 53) % 90) + (d < 10 ? 40 : 0) + (d % 7 === 5 ? -25 : 0);
    await db.dailyView.upsert({ where: { day: date }, update: {}, create: { day: date, views } });
  }

  // ---- 9. Audit jurnali ----
  if (admin && (await db.auditLog.count({ where: { userAgent: 'demo-seed' } })) === 0) {
    const A: [string, string, string, string][] = [
      ['LOGIN', 'Auth', 'auth', 'OK'], ['SCHOLARSHIP_CREATE', 'Scholarship', 'grants', 'OK'], ['SCHOLARSHIP_UPDATE', 'Scholarship', 'grants', 'OK'], ['REVIEW_APPROVED', 'Review', 'reviews', 'OK'],
      ['REVIEW_REJECTED', 'Review', 'reviews', 'OK'], ['APPLICATION_APPROVED', 'Application', 'applications', 'OK'], ['APPLICATION_NEEDS_INFO', 'Application', 'applications', 'OK'],
      ['COMPLAINT_RESOLVED', 'Complaint', 'complaints', 'OK'], ['USER_BLOCK', 'User', 'users', 'OK'], ['USER_UNBLOCK', 'User', 'users', 'OK'], ['TICKET_REPLY', 'Ticket', 'tickets', 'OK'], ['LOGIN', 'Auth', 'auth', 'FAIL'],
    ];
    for (const [i, [action, entity, section, result]] of A.entries())
      await db.auditLog.create({ data: { actorId: admin.id, action, entity, section, result, ip: '10.0.0.' + (10 + i), userAgent: 'demo-seed', createdAt: ago(i * 95 + 10) } });
  }

  // ---- 10. Bildirishnomalar (talabalar uchun) ----
  for (const u of users.slice(0, 5)) {
    const key = `demo-welcome-${u.id}`;
    await db.notification.upsert({ where: { dedupeKey: key }, update: {}, create: { userId: u.id, type: 'SYSTEM', dedupeKey: key, payload: { title: 'Grantora ga xush kelibsiz!', body: "Profilingizni to'ldiring va o'zingizga mos grantlarni toping." } } });
  }
  console.log(`Demo kontent tayyor: ${users.length} talaba, ${grants.length} grant.`);
}
