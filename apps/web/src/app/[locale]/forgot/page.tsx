import { setRequestLocale } from 'next-intl/server';
import ForgotForm from '@/components/ForgotForm';

export default async function Forgot({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return <ForgotForm />;
}
