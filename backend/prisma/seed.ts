/**
 * Boshlang'ich ma'lumot: davlatlar, kategoriyalar, admin va DEMO dasturlar.
 * DIQQAT: dasturlar nomlari haqiqiy, lekin muddatlar va tavsiflar NAMUNA (isDemo=true).
 * Haqiqiy muddatni har doim rasmiy saytdan tekshiring; admin panelda tasdiqlab, isDemo=false qiling.
 *
 * Admin: ADMIN_EMAIL va ADMIN_PASSWORD muhit o'zgaruvchilaridan olinadi (kodga yozilmaydi).
 */
import { PrismaClient, StudyLevel, FundingType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { COUNTRY_INFO, EXTRA_COUNTRIES, PROGRAMS, STORIES } from './seed-data';
import { demoUsers } from './seed-demo';

const db = new PrismaClient();
const day = (n: number) => new Date(Date.now() + n * 864e5);

const COUNTRIES: [string, string, string, string][] = [
  ['DE', 'Germaniya', 'Германия', 'Germany'], ['UK', 'Buyuk Britaniya', 'Великобритания', 'United Kingdom'],
  ['US', 'AQSH', 'США', 'United States'], ['TR', 'Turkiya', 'Турция', 'Türkiye'], ['KR', 'Janubiy Koreya', 'Южная Корея', 'South Korea'],
  ['JP', 'Yaponiya', 'Япония', 'Japan'], ['HU', 'Vengriya', 'Венгрия', 'Hungary'], ['FR', 'Fransiya', 'Франция', 'France'],
  ['CN', 'Xitoy', 'Китай', 'China'], ['SE', 'Shvetsiya', 'Швеция', 'Sweden'], ['EU', "Yevropa Ittifoqi", 'Европейский союз', 'European Union'],
  ['UZ', "O'zbekiston", 'Узбекистан', 'Uzbekistan'],
  ...EXTRA_COUNTRIES,
];
const CATEGORIES: [string, string, string, string][] = [
  ['government', 'Davlat granti', 'Государственный грант', 'Government'], ['university', 'Universitet', 'Университет', 'University'],
  ['foundation', 'Jamg\'arma', 'Фонд', 'Foundation'],
  ['it-engineering', 'IT va muhandislik', 'IT и инженерия', 'IT & Engineering'], ['medicine', 'Tibbiyot', 'Медицина', 'Medicine'],
  ['economics-business', 'Iqtisodiyot va biznes', 'Экономика и бизнес', 'Economics & Business'], ['natural-sciences', 'Tabiiy fanlar', 'Естественные науки', 'Natural sciences'],
  ['social-sciences', 'Ijtimoiy fanlar', 'Социальные науки', 'Social sciences'], ['education', 'Ta\'lim', 'Образование', 'Education'],
  ['art-design', 'San\'at va dizayn', 'Искусство и дизайн', 'Art & Design'],
];

interface Seed { slug: string; org: string; c: string; levels: StudyLevel[]; funding: FundingType; ielts?: number; gpa?: number; dl: number; url: string; lang: string;
  title: [string, string, string]; summary: [string, string, string] }
const L = ['uz', 'ru', 'en'] as const;
const S: Seed[] = [
  { slug: 'daad-scholarships', org: 'DAAD', c: 'DE', levels: ['MASTER', 'PHD'], funding: 'FULL', ielts: 6.5, gpa: 3.0, dl: 40, url: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/', lang: 'EN',
    title: ['DAAD stipendiyalari', 'Стипендии DAAD', 'DAAD Scholarships'],
    summary: ["Germaniyada magistratura va doktorantura uchun DAAD dasturlari.", 'Программы DAAD для магистратуры и докторантуры в Германии.', 'DAAD programmes for master\'s and doctoral study in Germany.'] },
  { slug: 'chevening', org: 'UK FCDO', c: 'UK', levels: ['MASTER'], funding: 'FULL', ielts: 6.5, gpa: 3.0, dl: 25, url: 'https://www.chevening.org', lang: 'EN',
    title: ['Chevening stipendiyasi', 'Стипендия Chevening', 'Chevening Scholarship'],
    summary: ["Buyuk Britaniyada bir yillik magistratura uchun davlat stipendiyasi.", 'Государственная стипендия на годичную магистратуру в Великобритании.', 'UK government scholarship for a one-year master\'s degree.'] },
  { slug: 'fulbright-foreign-student', org: 'Fulbright', c: 'US', levels: ['MASTER', 'PHD'], funding: 'FULL', ielts: 7.0, gpa: 3.2, dl: 60, url: 'https://foreign.fulbrightonline.org', lang: 'EN',
    title: ['Fulbright dasturi', 'Программа Fulbright', 'Fulbright Foreign Student Program'],
    summary: ["AQShda magistratura va doktorantura uchun Fulbright dasturi.", 'Программа Fulbright для магистратуры и докторантуры в США.', 'Fulbright programme for graduate study in the United States.'] },
  { slug: 'turkiye-burslari', org: 'YTB', c: 'TR', levels: ['BACHELOR', 'MASTER', 'PHD'], funding: 'FULL', dl: 45, url: 'https://turkiyeburslari.gov.tr', lang: 'EN',
    title: ['Türkiye Burslari', 'Türkiye Burslari', 'Türkiye Scholarships'],
    summary: ["Turkiyada o'qish uchun to'liq davlat granti.", 'Полный государственный грант на обучение в Турции.', 'Fully funded government scholarship to study in Türkiye.'] },
  { slug: 'mext-scholarship', org: 'MEXT', c: 'JP', levels: ['BACHELOR', 'MASTER', 'PHD'], funding: 'FULL', dl: 70, url: 'https://www.studyinjapan.go.jp', lang: 'EN',
    title: ['MEXT stipendiyasi', 'Стипендия MEXT', 'MEXT Scholarship'],
    summary: ["Yaponiya hukumatining xalqaro talabalar uchun stipendiyasi.", 'Стипендия правительства Японии для иностранных студентов.', 'Japanese government scholarship for international students.'] },
  { slug: 'stipendium-hungaricum', org: 'Tempus Public Foundation', c: 'HU', levels: ['BACHELOR', 'MASTER', 'PHD'], funding: 'FULL', ielts: 6.0, dl: 30, url: 'https://stipendiumhungaricum.hu', lang: 'EN',
    title: ['Stipendium Hungaricum', 'Stipendium Hungaricum', 'Stipendium Hungaricum'],
    summary: ["Vengriya universitetlarida o'qish uchun davlat stipendiyasi.", 'Государственная стипендия на обучение в университетах Венгрии.', 'Hungarian government scholarship for study at Hungarian universities.'] },
  { slug: 'el-yurt-umidi', org: 'El-Yurt Umidi Foundation', c: 'UZ', levels: ['BACHELOR', 'MASTER', 'PHD'], funding: 'FULL', dl: 50, url: 'https://el-yurt.uz', lang: 'EN',
    title: ["El-Yurt Umidi granti", 'Грант El-Yurt Umidi', 'El-Yurt Umidi Scholarship'],
    summary: ["O'zbekiston fuqarolari uchun xorijdagi nufuzli universitetlarda o'qish granti.", 'Грант для граждан Узбекистана на учёбу в ведущих зарубежных университетах.', 'Scholarship for Uzbek citizens to study at leading universities abroad.'] },
];

async function main() {
  for (const [code, nameUz, nameRu, nameEn] of COUNTRIES) {
    const i = COUNTRY_INFO[code];
    const extra = i ? { universities: i.unis, eduLang: i.lang, infoUz: i.uz, infoRu: i.ru, infoEn: i.en } : {};
    await db.country.upsert({ where: { code }, update: { nameUz, nameRu, nameEn, ...extra }, create: { code, nameUz, nameRu, nameEn, ...extra } });
  }
  for (const [slug, nameUz, nameRu, nameEn] of CATEGORIES) await db.category.upsert({ where: { slug }, update: {}, create: { slug, nameUz, nameRu, nameEn } });

  const email = process.env.ADMIN_EMAIL, pw = process.env.ADMIN_PASSWORD;
  if (email && pw) {
    await db.user.upsert({
      where: { email: email.toLowerCase() }, update: { role: 'ADMIN', emailVerifiedAt: new Date(), blockedAt: null },
      create: { email: email.toLowerCase(), passwordHash: await bcrypt.hash(pw, 12), role: 'ADMIN', firstName: 'Admin', lastName: 'Grantora', emailVerifiedAt: new Date(), profile: { create: {} } },
    });
    console.log('Admin tayyor:', email);
  } else console.log('ADMIN_EMAIL / ADMIN_PASSWORD berilmagan — admin yaratilmadi.');

  for (const s of S) {
    await db.scholarship.upsert({
      where: { slug: s.slug }, update: {},
      create: {
        slug: s.slug, organization: s.org, countryCode: s.c, levels: s.levels, fields: [], funding: s.funding, languageReq: s.lang,
        ieltsMin: s.ielts, gpaMin: s.gpa, deadline: day(s.dl), officialUrl: s.url, status: 'PUBLISHED', isDemo: true, featured: true,
        publishedAt: new Date(), lastVerifiedAt: new Date(),
        translations: { create: L.map((locale, i) => ({ locale, title: s.title[i], summary: s.summary[i] })) },
      },
    });
  }
  for (const [i, p] of PROGRAMS.entries()) {
    const data = { kind: p.kind, organization: p.org, countryCode: p.c, officialUrl: p.url, sortOrder: i, i18n: { uz: p.uz, ru: p.ru, en: p.en } };
    await db.program.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });
  }
  for (const [i, st] of STORIES.entries()) {
    const data = { name: st.name, university: st.uni, countryCode: st.c, program: st.program, sortOrder: i, isSample: true, i18n: { uz: st.uz, ru: st.ru, en: st.en } };
    await db.story.upsert({ where: { slug: st.slug }, update: {}, create: { slug: st.slug, ...data } });
  }
  if (process.env.SEED_DEMO_USERS === 'true') await demoUsers(db);
  console.log('Seed tugadi.');
}
main().finally(() => db.$disconnect());
