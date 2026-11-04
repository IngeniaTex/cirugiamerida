// Une en una sola imagen las fotos encimadas de data/composiciones.json (p. ej. "¿Qué alimentos pueden empeorar…?"),
// con la señal de prohibido en rojo que en Wix es un vector (el extractor no lo toma). Por separado no se acomodan bien
// en tablet y celular. Se respetan las posiciones y el orden de Wix; las fotos se recortan como allí: llenando su caja.
// uso: node tools/componer_imagenes.mjs   → public/img/<archivo>.webp
import fs from 'node:fs';
import sharp from 'sharp';

const ESCALA = 2;   // el doble de resolución para pantallas retina
const IMG = 'public/img/';
// Señal de prohibido de Wix (#FF4040 al 82 %)
const cruz = lado => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="26 26 148 148">
  <g fill="#FF4040" fill-opacity=".82">
    <path d="M130.4 121.3L109.1 100l21.3-21.3-9.1-9.1L100 90.9 78.7 69.6l-9.1 9.1L90.9 100l-21.3 21.3 9.1 9.1 21.3-21.3 21.3 21.3 9.1-9.1z"/>
    <path d="M100 26c-40.9 0-74 33.1-74 74s33.1 74 74 74 74-33.1 74-74-33.1-74-74-74zm0 137.7c-35.2 0-63.7-28.5-63.7-63.7S64.8 36.3 100 36.3s63.7 28.5 63.7 63.7-28.5 63.7-63.7 63.7z"/>
  </g></svg>`);

const { composiciones } = JSON.parse(fs.readFileSync('data/composiciones.json', 'utf8'));
for (const { archivo, fotos, cruz: [cx, cy, lado] } of composiciones) {
  const cajas = [...fotos.map(([, x, y, w, h]) => [x, y, w, h]), [cx, cy, lado, lado]];
  const x0 = Math.min(...cajas.map(c => c[0])), y0 = Math.min(...cajas.map(c => c[1]));
  const x1 = Math.max(...cajas.map(c => c[0] + c[2])), y1 = Math.max(...cajas.map(c => c[1] + c[3]));
  const capas = await Promise.all(fotos.map(async ([nombre, x, y, w, h]) => ({
    input: await sharp(IMG + nombre + '.webp').resize(w * ESCALA, h * ESCALA, { fit: 'cover' }).toBuffer(),
    left: (x - x0) * ESCALA, top: (y - y0) * ESCALA,
  })));
  capas.push({ input: cruz(lado * ESCALA), left: (cx - x0) * ESCALA, top: (cy - y0) * ESCALA });
  await sharp({ create: { width: (x1 - x0) * ESCALA, height: (y1 - y0) * ESCALA, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(capas).webp({ quality: 86, alphaQuality: 90 }).toFile(IMG + archivo + '.webp');
  console.log(archivo, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
}
