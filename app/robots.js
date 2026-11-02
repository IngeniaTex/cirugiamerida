import { sitio } from '@/lib/datos';

export const dynamic = 'force-static';
export default function robots() {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${sitio.dominio}/sitemap.xml` };
}
