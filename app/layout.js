import { Albert_Sans } from 'next/font/google';
import Encabezado from '@/components/Encabezado';
import Pie from '@/components/Pie';
import Efectos from '@/components/Efectos';
import { sitio, servicios, dietas, WA } from '@/lib/datos';
import './globals.css';

// Albert Sans: la tipografía libre más parecida a "aether" (la de Wix, con licencia solo para sitios de Wix).
const fuente = Albert_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--fuente' });

export const metadata = {
  metadataBase: new URL(sitio.dominio),
  icons: { icon: '/img/logo-joel-png.webp' },
};
export const viewport = { themeColor: '#173B4A' };

// Menú como en Wix: Inicio, Servicios (con sus padecimientos), Dietas especiales (con sus dietas), Ingreso a cirugía,
// Contacto y Preguntas Frecuentes.
const menu = [
  { texto: 'Inicio', url: '/' },
  { texto: 'Servicios', url: '/servicios/', hijos: servicios.filter(s => !s.oculta).map(s => ({ texto: s.menu, url: `/${s.slug}/` })) },
  { texto: 'Dietas especiales', url: '/dietas-especiales/', hijos: dietas.map(d => ({ texto: d.menu, url: `/${d.slug}/` })) },
  { texto: 'Ingreso a cirugía', url: '/pacientes/' },
  { texto: 'Contacto', url: '/#contacto' },
  { texto: 'Preguntas Frecuentes', url: '/#preguntas-frecuentes' },
];

export default function RootLayout({ children }) {
  return (
    <html lang="es-MX" className={fuente.variable}>
      <body>
        <a className="saltar" href="#contenido">Saltar al contenido</a>
        <Encabezado menu={menu} wa={WA} />
        <main id="contenido">{children}</main>
        <Pie />
        <Efectos />
      </body>
    </html>
  );
}
