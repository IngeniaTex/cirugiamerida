import Pagina from '@/components/Pagina';
import { meta } from '@/lib/datos';

const m = meta('inicio');
export const metadata = { title: m.titulo, description: m.descripcion, alternates: { canonical: '/' },
  openGraph: { title: m.titulo, description: m.descripcion, url: '/', locale: 'es_MX', type: 'website' } };

export default function Inicio() {
  return <Pagina slug="inicio" />;
}
