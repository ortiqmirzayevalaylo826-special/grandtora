/**
 * Moslik foizi — FAQAT profil va dastur talablarining mosligi.
 * Bu qabul qilinish ehtimoli EMAS (frontendda shunday izohlanadi).
 * Og'irliklar: daraja 30, yo'nalish 25, IELTS 15, GPA 15, yosh 15 = 100.
 */
export interface MatchProfile { level?: string | null; major?: string | null; gpa?: number | null; ielts?: number | null; age?: number | null }
export interface MatchTarget { levels: string[]; fields: string[]; ieltsMin?: number | null; gpaMin?: number | null; ageMin?: number | null; ageMax?: number | null }

export function matchScore(t: MatchTarget, p: MatchProfile) {
  const checks: { key: string; ok: boolean; weight: number }[] = [
    { key: 'level', weight: 30, ok: !p.level || t.levels.includes(p.level) },
    { key: 'field', weight: 25, ok: !p.major || t.fields.length === 0 || t.fields.includes(p.major) },
    { key: 'ielts', weight: 15, ok: p.ielts == null || t.ieltsMin == null || p.ielts >= t.ieltsMin },
    { key: 'gpa', weight: 15, ok: p.gpa == null || t.gpaMin == null || p.gpa >= t.gpaMin },
    { key: 'age', weight: 15, ok: p.age == null || ((t.ageMin == null || p.age >= t.ageMin) && (t.ageMax == null || p.age <= t.ageMax)) },
  ];
  return { percent: checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0), checks };
}

/** Prisma Decimal/null -> number | null */
export const toNum = (v: unknown): number | null => (v == null ? null : Number(v));
