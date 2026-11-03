'use client';
// Encabezado como el de Wix (logotipo, menú con submenús y monograma), fijo y compacto al bajar; menú lateral en celular
// con el botón de cita debajo de las opciones.
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icono } from './Iconos';

export default function Encabezado({ menu, wa }) {
  const ruta = usePathname();
  const [compacto, setCompacto] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [sub, setSub] = useState(null);
  useEffect(() => {
    const f = () => setCompacto(scrollY > 30);
    f(); addEventListener('scroll', f, { passive: true });
    return () => removeEventListener('scroll', f);
  }, []);
  useEffect(() => { setAbierto(false); setSub(null); }, [ruta]);
  useEffect(() => { document.body.classList.toggle('menu-abierto', abierto); }, [abierto]);
  const activo = m => m.url === '/' ? ruta === '/' : ruta.startsWith(m.url) || (m.hijos || []).some(h => ruta === h.url);
  return (
    <header className={'cabecera' + (compacto ? ' compacta' : '')}>
      <div className="cabecera-fila">
        <a className="marca" href="/" aria-label="Dr. Joel Dorantes, inicio"><img src="/img/logo-cabecera.webp" alt="Dr. Joel Dorantes" /></a>
        <nav className={'nav' + (abierto ? ' abierta' : '')} aria-label="Principal">
          <ul>
            {menu.map((m, i) => (
              <li key={m.url} className={(m.hijos ? 'con-sub' : '') + (activo(m) ? ' activo' : '')}>
                <a href={m.url} aria-current={ruta === m.url ? 'page' : undefined}>{m.texto}</a>
                {m.hijos && <>
                  <button className="abrir-sub" aria-expanded={sub === i} aria-label={`Ver ${m.texto}`} onClick={() => setSub(sub === i ? null : i)}><Icono n="chev" /></button>
                  <ul className={'submenu' + (sub === i ? ' abierto' : '')}>
                    {m.hijos.map(h => <li key={h.url}><a href={h.url} aria-current={ruta === h.url ? 'page' : undefined}>{h.texto}</a></li>)}
                  </ul>
                </>}
              </li>
            ))}
          </ul>
          <a className="btn-menu-cita" href={wa} target="_blank" rel="noopener"><Icono n="cal" /><span>Agenda tu cita hoy</span><Icono n="flecha" /></a>
        </nav>
        <a className="monograma" href="/" aria-hidden="true" tabIndex={-1}><img src="/img/logo-joel-png.webp" alt="" /></a>
        <button className="hamburguesa" aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}
