import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);
// api, _next, fayllar (manifest, sw.js, rasm) va hokazolar tarjima yo'nalishidan chiqarib tashlanadi
export const config = { matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'] };
