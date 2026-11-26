import type { MetadataRoute } from 'next';
import { BRAND } from '@/brand';

// Brauzer "Ilovani o'rnatish" taklifi uchun. Kompyuterda ham, telefonda ham ishlaydi.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} — grants`,
    short_name: BRAND.name,
    description: 'Scholarships and grants from around the world',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F7F9F8',
    theme_color: '#087F5B',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
