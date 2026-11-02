// Página completa: sus secciones en el orden de Wix y los datos estructurados.
import Seccion from './Seccion';
import { pagina, esquemas } from '@/lib/datos';

export default function Pagina({ slug }) {
  const datos = pagina(slug);
  return (
    <>
      {esquemas(datos).map((e, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(e) }} />)}
      {datos.secciones.map((s, i) => <Seccion key={i} s={s} n={i} />)}
    </>
  );
}
