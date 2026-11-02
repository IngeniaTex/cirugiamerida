'use client';
// Preguntas frecuentes en acordeón, con apertura animada.
import { useState } from 'react';
import { Icono } from './Iconos';

export default function Faq({ preguntas }) {
  const [abierta, setAbierta] = useState(-1);
  return (
    <div className="faq">
      <h2 className="faq-titulo">Preguntas frecuentes</h2>
      {preguntas.map((q, i) => (
        <div className={'faq-item' + (abierta === i ? ' abierta' : '')} key={i}>
          <button type="button" aria-expanded={abierta === i} onClick={() => setAbierta(abierta === i ? -1 : i)}>
            <span>{q.p}</span><Icono n="mas" />
          </button>
          <div className="faq-resp" role="region"><div className="faq-resp-int" dangerouslySetInnerHTML={{ __html: q.r }} /></div>
        </div>
      ))}
    </div>
  );
}
