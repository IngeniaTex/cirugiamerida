// Dibuja una sección tal como está en Wix: cada elemento (caja, texto, imagen, botón, línea, preguntas frecuentes)
// en su posición del lienzo de 1440 px.
// · Escritorio: todo se posiciona con coordenadas absolutas (--ax, --ay) y se pinta en el orden de Wix (z-index = orden);
//   los grupos de las cajas usan display: contents para no crear capas propias.
// · Tablet y celular: cada caja envuelve a sus elementos y todo se acomoda en orden, de arriba a abajo.
import Faq from './Faq';
import Desplegable from './Desplegable';
import Carrusel from './Carrusel';
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

// Botones del mismo renglón (misma caja y misma altura en Wix): van juntos en una fila con separación fija,
// para que no se encimen ni crezcan hacia un solo lado cuando el texto es más ancho que en Wix.
// La fila se alinea con el texto de arriba: por la izquierda si en Wix ya lo estaba, o centrada (en el centro del
// texto si en Wix quedaba casi centrada). Con `fijas` (tarjetas ya centradas en los datos) solo se centra donde está.
function agruparBotones(items, fijas) {
  const filas = new Map();
  for (const it of items) {
    if (it.k !== 'btn' || it.tipo === 'cita') continue;
    const clave = `${it.padre}|${Math.round(it.y / 12)}`;
    filas.set(clave, [...(filas.get(clave) || []), it]);
  }
  const fuera = new Set();
  const nuevas = [];
  for (const botones of filas.values()) {
    botones.sort((a, b) => a.x - b.x).forEach(b => fuera.add(b));
    const fila = { k: 'fila', id: Math.min(...botones.map(b => b.id)), padre: botones[0].padre, orden: Math.min(...botones.map(b => b.orden)),
      x: botones[0].x, y: Math.min(...botones.map(b => b.y)), h: Math.max(...botones.map(b => b.h)), botones };
    fila.w = Math.max(...botones.map(b => b.x + b.w)) - fila.x;
    // Alineación fijada en los datos (p. ej. el botón junto al de cita al cierre de las páginas)
    fila.alinear = botones.find(b => b.alinear)?.alinear;
    const texto = fijas || fila.alinear ? null : items.filter(t => t.k === 'texto' && !t.enlace && t.padre === fila.padre && t.y + t.h <= fila.y + 10
      && fila.y - (t.y + t.h) < 300 && t.x < fila.x + fila.w && fila.x < t.x + t.w).sort((a, b) => b.y + b.h - (a.y + a.h))[0];
    if (texto && Math.abs(fila.x - texto.x) <= 12) { fila.x = texto.x; fila.alinear = 'izq'; }
    else if (texto && Math.abs(fila.x + fila.w / 2 - (texto.x + texto.w / 2)) <= 40) fila.x = Math.round(texto.x + (texto.w - fila.w) / 2);
    nuevas.push(fila);
  }
  return [...items.filter(i => !fuera.has(i)), ...nuevas];
}

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
    // Decorativa: sin contenido propio ni en sus cajas internas (p. ej. el marco blanco detrás de una ilustración);
    // en tablet y celular no se dibuja, porque quedaría como un bloque vacío
    const conContenido = c => !!c.bimg || todos.some(o => o.padre === c.id && (o.k !== 'caja' || conContenido(o)));
    const grupo = ['el-grupo', oscura ? 'oscura' : '', !conContenido(it) ? 'decorativa' : '', it.banda ? 'banda' : ''].join(' ');
    // Foto en una columna muy alta (p. ej. el doctor en "¿Por qué elegir…?"): se queda fija al bajar para que se le vea la cara
    if (it.bimg && it.h > it.w * 2) clases.push('retrato');
    return (
      <div className={grupo} style={{ order: it.orden, '--bg': it.bg || 'transparent' }}>
        <div className={clases.join(' ')} style={fondoCaja} aria-hidden="true">
          {it.bimg && <img className="caja-fondo" src={it.bimg} alt="" loading={carga} style={it.pos ? { objectPosition: it.pos } : undefined} />}
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
    if (it.enlace) return <a className={clases.join(' ') + ' etiqueta'} style={estilo} href={it.enlace} dangerouslySetInnerHTML={{ __html: it.html }} />;
    return <div className={clases.join(' ')} style={estilo} dangerouslySetInnerHTML={{ __html: it.html }} />;
  }
  if (it.k === 'img') {
    if (it.rad && it.rad !== '0px') estilo.borderRadius = it.rad;
    if (it.posMovil) estilo['--pos-movil'] = it.posMovil;
    clases.push('revelar', it.fit === 'contain' ? 'img-contain' : 'img-cover');
    if (it.heroe) clases.push('heroe');
    const img = <img src={it.src} alt={it.alt || ''} loading={carga} decoding="async" />;
    return it.href
      ? <a className={clases.join(' ')} style={estilo} href={it.href} target={it.href.startsWith('http') ? '_blank' : undefined} rel="noopener">{img}</a>
      : <figure className={clases.join(' ')} style={estilo}>{img}</figure>;
  }
  if (it.k === 'fila') {
    // El primer botón de la fila es el principal (relleno); los demás, secundarios (contorno)
    if (it.alinear) clases.push('fila-' + it.alinear);
    return (
      <div className={clases.join(' ')} style={estilo}>
        {it.botones.map((b, i) => <Elemento key={b.id} it={{ ...b, secundario: i > 0 }} todos={todos} fondo={fondo} prioridad={prioridad} />)}
      </div>
    );
  }
  if (it.k === 'btn') {
    const claro = luminancia(fondo) < 0.45;
    clases.push('revelar', it.tipo === 'cita' ? 'btn-cita' : claro ? 'btn-claro' : 'btn-oscuro');
    if (it.secundario) clases.push('btn-sec');
    if (it.tipo === 'desplegable') return <Desplegable clase={clases.join(' ')} estilo={estilo} texto={it.t} opciones={it.opciones} />;
    const externo = it.href.startsWith('http');
    return (
      <a className={clases.join(' ')} style={estilo} href={it.href} target={externo ? '_blank' : undefined} rel={externo ? 'noopener' : undefined}>
        {it.tipo === 'cita' && <Icono n="cal" />}<span>{it.t}</span><Icono n="flecha" />
      </a>
    );
  }
  if (it.k === 'linea') return <div className={clases.join(' ')} style={estilo} aria-hidden="true" />;
  if (it.k === 'mapa') return <div className={clases.join(' ')} style={estilo}><iframe src={it.src} title={it.titulo} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" /></div>;
  if (it.k === 'faq') return <div className={clases.join(' ')} style={estilo}><Faq preguntas={it.preguntas} /></div>;
  if (it.k === 'carrusel') return <Carrusel clase={clases.join(' ')} estilo={estilo} diapositivas={it.diapositivas} />;
  return null;
}

export default function Seccion({ s, n }) {
  const conFaq = s.items.some(i => i.k === 'faq');
  // Orden en celular: por renglones de arriba a abajo y, en el mismo renglón, de izquierda a derecha
  [...s.items].sort((a, b) => (Math.abs(a.y - b.y) < 24 ? a.x - b.x : a.y - b.y)).forEach((it, k) => { it.orden = k; });
  // Tarjetas (las secciones con "Ver padecimientos" o marcadas en los datos): botones compactos y centrados con su texto
  const tarjetas = s.tarjetas || s.items.some(i => i.tipo === 'desplegable');
  const items = agruparBotones(s.items, tarjetas);
  const raiz = items.filter(i => i.padre == null).sort((a, b) => a.id - b.id);
  return (
    <section className={'wx' + (conFaq ? ' wx-flujo' : '') + (tarjetas ? ' wx-tarjetas' : '')} style={{ background: s.bg && s.bg !== 'rgba(0, 0, 0, 0)' ? s.bg : undefined }}
      id={s.ancla || (conFaq ? 'preguntas-frecuentes' : undefined)}>
      {s.bgImg && <img className={'wx-fondo' + (s.fondoRepetido ? ' solo-escritorio' : '')} src={s.bgImg} alt="" loading={n === 0 ? 'eager' : 'lazy'} />}
      {s.velo && <div className="wx-velo" aria-hidden="true" />}
      <div className="wx-marco">
        <div className="wx-lienzo" style={{ '--h': s.h }}>
          {raiz.map(it => <Elemento key={it.id} it={it} todos={items} fondo={s.bg} prioridad={n === 0} />)}
        </div>
      </div>
    </section>
  );
}
