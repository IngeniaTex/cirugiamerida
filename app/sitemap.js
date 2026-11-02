import { sitio, slugs } from '@/lib/datos';

export const dynamic = 'force-static';
export default function sitemap() {
  return ['', ...slugs()].map(s => ({ url: `${sitio.dominio}/${s ? s + '/' : ''}` }));
}
