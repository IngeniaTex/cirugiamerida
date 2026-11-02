// Pie de página como el de Wix: credenciales, contacto, información y logotipo.
import { sitio, WA, TEL } from '@/lib/datos';
import { Icono } from './Iconos';

export default function Pie() {
  const C = sitio.contacto;
  return (
    <>
      <footer className="pie">
        <div className="pie-rejilla">
          <div><p className="pie-titulo">{sitio.nombre}</p><ul>{sitio.pie.credenciales.map(c => <li key={c}>{c}</li>)}</ul></div>
          <div><p className="pie-titulo">Contacto</p><ul>
            <li><a href={WA} target="_blank" rel="noopener">Agendar por WhatsApp</a></li>
            <li><a href={`tel:${TEL}`}>Llamar ahora</a></li>
            {C.telefonos.map(t => <li key={t.tel}><a href={`tel:${t.tel}`}>Tel. {t.texto}</a></li>)}
            <li><a href={`mailto:${C.correo}`}>{C.correo}</a></li>
            <li><a href={C.mapa} target="_blank" rel="noopener">{C.siglas}</a></li>
          </ul></div>
          <div><p className="pie-titulo">Información</p><ul>
            <li><a href="/#preguntas-frecuentes">Preguntas frecuentes</a></li>
            <li><a href="/servicios/">Servicios</a></li>
            <li><a href="/dietas-especiales/">Dietas especiales</a></li>
          </ul></div>
          <a className="pie-logo" href="/"><img src="/img/logo-vertical.webp" alt="Dr. Joel Dorantes, Cirugía Gastrointestinal y Laparoscopía Avanzada" loading="lazy" /></a>
        </div>
        <p className="pie-legal">{sitio.pie.copyright}</p>
      </footer>
      <a className="wa-flotante" href={WA} target="_blank" rel="noopener" aria-label="Agendar por WhatsApp"><Icono n="wa" /><span>Agendar por WhatsApp</span></a>
    </>
  );
}
