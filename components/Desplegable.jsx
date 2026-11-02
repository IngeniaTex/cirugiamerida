'use client';
// Botón "Ver padecimientos": abre la lista de páginas de esa tarjeta.
import { useEffect, useRef, useState } from 'react';
import { Icono } from './Iconos';

export default function Desplegable({ clase, estilo, texto, opciones = [] }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const cerrar = e => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('click', cerrar);
    return () => document.removeEventListener('click', cerrar);
  }, []);
  return (
    <div className={clase + ' desplegable' + (abierto ? ' abierto' : '')} style={estilo} ref={ref}>
      <button type="button" aria-expanded={abierto} onClick={() => setAbierto(!abierto)}><span>{texto}</span><Icono n="chev" /></button>
      {abierto && <ul>{opciones.map(o => <li key={o.href}><a href={o.href}>{o.t}<Icono n="flecha" /></a></li>)}</ul>}
    </div>
  );
}
