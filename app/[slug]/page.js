import Pagina from '@/components/Pagina';
import { meta, slugs } from '@/lib/datos';

export const dynamicParams = false;
export function generateStaticParams() {
  return slugs().map(slug => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const m = meta(slug);
  return { title: m.titulo, description: m.descripcion, alternates: { canonical: `/${slug}/` },
    openGraph: { title: m.titulo, description: m.descripcion, url: `/${slug}/`, locale: 'es_MX', type: 'website' } };
}

export default async function PaginaWix({ params }) {
  const { slug } = await params;
  return <Pagina slug={slug} />;
}
