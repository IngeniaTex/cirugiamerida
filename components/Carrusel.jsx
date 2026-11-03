'use client';
// Carrusel de testimonios como el de Wix: cambia solo cada 6 s (se pausa con el cursor o el foco), con flechas, puntos
// y deslizamiento con el dedo. Cada diapositiva tiene su fondo y, si lleva testimonio, su cita y su autor.
import { useEffect, useRef, useState } from 'react';
import { Icono } from './Iconos';

const INTERVALO = 6000;

export default function Carrusel({ clase, estilo, diapositivas }) {
  const [actual, setActual] = useState(0);
  const [pausa, setPausa] = useState(false);
  const toque = useRef(null);
  const n = diapositivas.length;
  const ir = i => setActual((i + n) % n);
  useEffect(() => {
    if (pausa || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => setActual(a => (a + 1) % n), INTERVALO);
    return () => clearTimeout(t);
  }, [actual, pausa, n]);
  const tono = diapositivas[actual].tono || 'foto';
  return (
    <div className={`${clase} carrusel tono-${tono}`} style={estilo} role="region" aria-roledescription="carrusel" aria-label="Testimonios de pacientes"
      onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)} onFocus={() => setPausa(true)} onBlur={() => setPausa(false)}
      onTouchStart={e => { toque.current = e.touches[0].clientX; }}
      onTouchEnd={e => { const d = e.changedTouches[0].clientX - toque.current; if (Math.abs(d) > 40) ir(actual + (d < 0 ? 1 : -1)); }}>
      {diapositivas.map((d, i) => (
        <figure key={i} className={'diapositiva' + (d.tono ? ' ' + d.tono : '') + (i === actual ? ' activa' : '')}
          aria-roledescription="diapositiva" aria-label={`${i + 1} de ${n}`} aria-hidden={i !== actual}>
          <img src={d.img} alt={d.alt || ''} loading="lazy" decoding="async" />
          {d.cita && <>
            <blockquote>
              <span className="comilla" aria-hidden="true">“</span>
              <p dangerouslySetInnerHTML={{ __html: d.cita }} />
            </blockquote>
            <figcaption>{d.autor}</figcaption>
          </>}
        </figure>
      ))}
      <button type="button" className="carrusel-flecha anterior" aria-label="Testimonio anterior" onClick={() => ir(actual - 1)}><Icono n="flecha" /></button>
      <button type="button" className="carrusel-flecha siguiente" aria-label="Testimonio siguiente" onClick={() => ir(actual + 1)}><Icono n="flecha" /></button>
      <div className="carrusel-puntos">
        {diapositivas.map((_, i) => (
          <button type="button" key={i} aria-label={`Ver diapositiva ${i + 1}`} aria-current={i === actual} onClick={() => ir(i)} />
        ))}
      </div>
    </div>
  );
}
