// Dibuja una sección tal como está en Wix: cada elemento (caja, texto, imagen, botón, línea, preguntas frecuentes)
// en su posición del lienzo de 1440 px.
// · Escritorio: todo se posiciona con coordenadas absolutas (--ax, --ay) y se pinta en el orden de Wix (z-index = orden);
//   los grupos de las cajas usan display: contents para no crear capas propias.
// · Tablet y celular: cada caja envuelve a sus elementos y todo se acomoda en orden, de arriba a abajo.
import Faq from './Faq';
import Desplegable from './Desplegable';
import { Icono } from './Iconos';

const ANCHO = 1440;

function luminancia(rgb) {
  const m = (rgb || '').match(/\d+(\.\d+)?/g);
  if (!m) return 1;
  const [r, g, b, a = 1] = m.map(Number);
  if (+a === 0) return 1;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

const tamano = fs => (fs >= 40 ? 't-xl' : fs >= 28 ? 't-l' : fs >= 21 ? 't-m' : 't-s');

function Elemento({ it, todos, fondo, prioridad }) {
  const hijos = todos.filter(o => o.padre === it.id).sort((a, b) => a.id - b.id);
  const estilo = { '--ax': it.x, '--ay': it.y, '--w': it.w, '--h': it.h, zIndex: it.id + 1, order: it.orden };
  const clases = ['el', `el-${it.k}`];
  if (it.x <= 2) clases.push('pega-izq');
  if (it.x + it.w >= ANCHO - 2) clases.push('pega-der');
  const carga = prioridad ? 'eager' : 'lazy';

  if (it.k === 'caja') {
    const oscura = luminancia(it.bg) < 0.45;
    const fondoCaja = { ...estilo, background: it.bg || undefined, borderRadius: it.rad && it.rad !== '0px' ? it.rad : undefined };
    const grupo = ['el-grupo', oscura ? 'oscura' : '', !hijos.length && !it.bimg ? 'decorativa' : ''].join(' ');
    return (
      <div className={grupo} style={{ order: it.orden, '--bg': it.bg || 'transparent' }}>
        <div className={clases.join(' ')} style={fondoCaja} aria-hidden="true">
          {it.bimg && <img className="caja-fondo" src={it.bimg} alt="" loading={carga} />}
        </div>
        {hijos.map(h => <Elemento key={h.id} it={h} todos={todos} fondo={it.bg || fondo} prioridad={prioridad} />)}
      </div>
    );
  }
  if (it.k === 'texto') {
    estilo['--fs'] = it.fs;
    estilo.color = it.color;
    estilo.textAlign = it.align === 'justify' || it.align === 'start' ? 'left' : it.align === 'end' ? 'right' : it.align;
    clases.push(tamano(it.fs), 'revelar');
    if (it.fondo) clases.push('con-fondo');
    if (it.comillas) clases.push('comillas');
    if (it.enlace) return <a className={clases.join(' ') + ' etiqueta'} style={estilo} href={it.enlace} dangerouslySetInnerHTML={{ __html: it.html }} />;
    return <div className={clases.join(' ')} style={estilo} dangerouslySetInnerHTML={{ __html: it.html }} />;
  }
  if (it.k === 'img') {
    if (it.rad && it.rad !== '0px') estilo.borderRadius = it.rad;
    clases.push('revelar', it.fit === 'contain' ? 'img-contain' : 'img-cover');
    if (it.heroe) clases.push('heroe');
    const img = <img src={it.src} alt={it.alt || ''} loading={carga} decoding="async" />;
    return it.href
      ? <a className={clases.join(' ')} style={estilo} href={it.href} target={it.href.startsWith('http') ? '_blank' : undefined} rel="noopener">{img}</a>
      : <figure className={clases.join(' ')} style={estilo}>{img}</figure>;
  }
  if (it.k === 'btn') {
    const claro = luminancia(fondo) < 0.45;
    clases.push('revelar', it.tipo === 'cita' ? 'btn-cita' : claro ? 'btn-claro' : 'btn-oscuro');
    if (it.tipo === 'desplegable') return <Desplegable clase={clases.join(' ')} estilo={estilo} texto={it.t} opciones={it.opciones} />;
    const externo = it.href.startsWith('http');
    return (
      <a className={clases.join(' ')} style={estilo} href={it.href} target={externo ? '_blank' : undefined} rel={externo ? 'noopener' : undefined}>
        {it.tipo === 'cita' && <Icono n="cal" />}<span>{it.t}</span><Icono n="flecha" />
      </a>
    );
  }
  if (it.k === 'linea') return <div className={clases.join(' ')} style={estilo} aria-hidden="true" />;
  if (it.k === 'faq') return <div className={clases.join(' ')} style={estilo}><Faq preguntas={it.preguntas} /></div>;
  return null;
}

export default function Seccion({ s, n }) {
  const conFaq = s.items.some(i => i.k === 'faq');
  // Orden en celular: por renglones de arriba a abajo y, en el mismo renglón, de izquierda a derecha
  [...s.items].sort((a, b) => (Math.abs(a.y - b.y) < 24 ? a.x - b.x : a.y - b.y)).forEach((it, k) => { it.orden = k; });
  const raiz = s.items.filter(i => i.padre == null).sort((a, b) => a.id - b.id);
  return (
    <section className={'wx' + (conFaq ? ' wx-flujo' : '')} style={{ background: s.bg && s.bg !== 'rgba(0, 0, 0, 0)' ? s.bg : undefined }}
      id={conFaq ? 'preguntas-frecuentes' : undefined}>
      {s.bgImg && <img className="wx-fondo" src={s.bgImg} alt="" loading={n === 0 ? 'eager' : 'lazy'} />}
      {s.velo && <div className="wx-velo" aria-hidden="true" />}
      <div className="wx-marco">
        <div className="wx-lienzo" style={{ '--h': s.h }}>
          {raiz.map(it => <Elemento key={it.id} it={it} todos={s.items} fondo={s.bg} prioridad={n === 0} />)}
        </div>
      </div>
    </section>
  );
}
