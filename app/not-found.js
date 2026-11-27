import Link from 'next/link';
import { Icono } from '@/components/Iconos';
import { WA } from '@/lib/datos';

// Página 404 (out/404.html). Cloudflare la sirve con estado 404 en cualquier ruta que no exista
// ("not_found_handling": "404-page" en wrangler.jsonc).
// SEO: estado 404 real (nunca redirigir a inicio, Google lo toma como "soft 404"), noindex (Next lo agrega solo),
// sin canonical ni entrada en el sitemap, y enlaces internos a las secciones principales para no perder la visita.
export const metadata = {
  title: 'Página no encontrada | Dr. Joel Dorantes',
  description: 'La página que buscas no existe o cambió de dirección. Visita el inicio o consulta los servicios del Dr. Joel Dorantes, cirujano general en Mérida.',
};

const secciones = [
  { texto: 'Servicios', url: '/servicios/' },
  { texto: 'Dietas especiales', url: '/dietas-especiales/' },
  { texto: 'Ingreso a cirugía', url: '/pacientes/' },
  { texto: 'Cuidados postoperatorios', url: '/cuidados-postoperatorios/' },
  { texto: 'Formación y experiencia', url: '/sobre-mi/' },
];

export default function NoEncontrada() {
  return (
    <section className="e404">
      <p className="e404-codigo" aria-hidden="true">404</p>
      <h1>Página no encontrada</h1>
      <p className="e404-texto">La página que buscas no existe o cambió de dirección. Revisa que la dirección esté bien escrita o regresa al inicio.</p>
      <div className="e404-botones">
        <Link className="el-btn btn-oscuro" href="/">Ir al inicio<Icono n="flecha" /></Link>
        <a className="el-btn btn-oscuro btn-sec" href={WA} target="_blank" rel="noopener"><Icono n="wa" />Escríbenos por WhatsApp</a>
      </div>
      <nav className="e404-secciones" aria-label="Secciones del sitio">
        <h2>También puedes visitar</h2>
        <ul>
          {secciones.map(s => <li key={s.url}><Link href={s.url}>{s.texto}</Link></li>)}
        </ul>
      </nav>
    </section>
  );
}
