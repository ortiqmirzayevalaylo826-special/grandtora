import { LegalPage, legalMeta } from '@/components/Legal';
type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P) { return legalMeta((await params).locale, 'terms'); }
export default async function Terms({ params }: P) { return LegalPage({ locale: (await params).locale, kind: 'terms' }); }
