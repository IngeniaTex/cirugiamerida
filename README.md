# cirugiamerida.com — Next.js

Réplica del sitio publicado en https://joeldorantes.wixsite.com/cirugiamerida (Inicio, Servicios con sus padecimientos
y tratamientos, y Dietas especiales con sus dietas), con los **textos e imágenes en la misma posición que en Wix**, los mismos
colores y mejoras de diseño: encabezado fijo que se compacta, menú lateral en celular, animaciones al aparecer, acordeón
animado en preguntas frecuentes, botón flotante de WhatsApp, efectos al pasar el cursor y versión adaptada a celular.

Next.js 16 (App Router) con exportación estática: `npm run build` genera la carpeta `out/`, que se publica en
Cloudflare Workers (archivos estáticos, sin código de servidor).

## Uso

```bash
npm install
npm run dev      # desarrollo en http://localhost:3000
npm run build    # genera out/
npm start        # sirve out/ con Cloudflare (wrangler dev) en http://localhost:8787, igual que en producción
npm run preview  # build + wrangler dev
npm run deploy   # build + publica en Cloudflare (normalmente lo hace Cloudflare solo al hacer push a main)
```

Requiere Node 22 o superior (wrangler lo pide; ver `.nvmrc`). No corras `npm run build` con `npm run dev` abierto
(comparten `.next`): detén dev, compila y luego `rm -rf .next` antes de volver a dev.

## Hosting (Cloudflare Workers)

- `wrangler.jsonc`: Worker `cirugiamerida` que sirve `out/`. Los dominios `cirugiamerida.com` (principal) y
  `www.cirugiamerida.com` se declaran ahí en `routes`; el deploy crea sus registros DNS y certificados. `www` redirige a
  `cirugiamerida.com` con una regla de redirección (301) en la zona de Cloudflare.
  **Pendiente:** `routes` está comentado hasta que la zona `cirugiamerida.com` esté activa en Cloudflare (con dominios
  en una zona que no existe, el deploy falla con "Can't infer zone from route" [10082]); mientras, el sitio se publica
  en `*.workers.dev`.
- Cada push a `main` compila (`npm run build`) y publica (`npx wrangler deploy`) desde la integración de Git de Cloudflare.
- URLs con diagonal final (`trailingSlash: true` + `html_handling: "auto-trailing-slash"`): `/hernias-merida` y
  `/hernias-merida.html` redirigen a `/hernias-merida/`. Las rutas inexistentes responden 404 con `out/404.html`.
- `public/_headers`: caché de un año para `/_next/static/*` (nombres con hash) y de una semana para `/img/*`.
- Por ser exportación estática no se puede usar: rutas `app/api`, middleware, `headers()`/`cookies()`, ISR/`revalidate`,
  server actions ni `next/image` optimizado. Toda ruta dinámica necesita `generateStaticParams`. Si algún día hace falta
  un formulario que envíe correos, va en un Worker bajo `/api/*` (ver `wrangler.jsonc`).

## Cómo funciona

Wix acomoda cada elemento en un lienzo de 1440 px. Este sitio guarda esa misma posición:

1. `tools/extraer_wix.mjs` lee cada página publicada en Wix y guarda en `data/wix/` cada sección con sus cajas de color,
   textos (con tamaño, color y alineación de cada párrafo), imágenes, botones, líneas y preguntas frecuentes (con sus respuestas).
2. `tools/importar_wix.py` convierte esa estructura en `data/paginas/<ruta>.json`: cambia los enlaces de Wix por las rutas
   nuevas, convierte las imágenes-botón de Wix en botones reales, agrupa cada elemento dentro de su caja (para celular) y
   descarga las imágenes a `public/img/` en WebP. Cada imagen lleva el nombre de su original en la carpeta `IMAGENES`
   (o `LOGOS`) en minúsculas, sin acentos y con guiones: "Edificio Faro del Mayab al atardecer.png" →
   `edificio-faro-del-mayab-al-atardecer.webp`. La relación está en `data/imagenes.json`.
3. `components/Seccion.jsx` dibuja cada sección:
   - **Escritorio (≥1200 px):** cada elemento en su posición de Wix, escalada al ancho de la ventana y pintada en el mismo orden.
   - **Tablet y celular:** cada caja envuelve a sus elementos y todo se acomoda de arriba a abajo.

Para volver a importar después de cambiar algo en Wix:

```bash
node tools/extraer_wix.mjs data/wix "" servicios about-1 …     # páginas de Wix (requiere puppeteer-core y Chrome)
node tools/componer_imagenes.mjs                              # fotos encimadas → una sola imagen (data/composiciones.json)
FFMPEG=/ruta/ffmpeg python3 tools/importar_wix.py              # o solo algunas: ... importar_wix.py about-9 home
```

## Archivos

| Archivo | Qué contiene |
| --- | --- |
| `data/paginas/*.json` | Secciones y elementos de cada página (textos editables en `html`) |
| `data/sitio.json` | Teléfonos, WhatsApp, correo, dirección y pie de página |
| `data/imagenes.json` | Nombre de cada imagen de Wix en `public/img/` (el de su original en `IMAGENES`) |
| `data/composiciones.json` | Fotos encimadas de Wix que se unen en una sola imagen con la señal de prohibido roja (alimentos de gastritis, intestino irritable y colitis) |
| `data/paginas.json` | Menú, metatítulos y metadescripciones (de `METATITULOS.docx` y de cada bloque) |
| `app/globals.css` | Colores, tipografía, lienzo de Wix, botones, preguntas frecuentes y versión celular |
| `components/` | Encabezado, pie, sección, preguntas frecuentes, desplegable "Ver padecimientos" |

## Rutas

Las direcciones son las que propone `METATITULOS.docx`: `/hernias-merida/`, `/cirugia-vesicula-merida/`, `/dieta-blanda/`, etc.
Las páginas de tratamiento (cirugía de vesícula, operación de hernia, cirugía de apendicitis, cirugía para reflujo) no aparecen
en el menú, igual que en Wix.
"Ingreso a cirugía" (`/copia-de-inicio` en Wix) está en `/pacientes/`; su título y descripción están en `lib/datos.js`.
"Cuidados postoperatorios" (`/copia-de-dietas-especiales` en Wix) está en `/cuidados-postoperatorios/` y "Formación y experiencia"
(`/about-9` en Wix) en `/sobre-mi/`; sus títulos y descripciones, de `METATITULOS.docx`, están en `lib/datos.js`. Los botones "Conocer más" de Cuidados
llevan a secciones de la misma página (`#heridas-quirurgicas`, `#drenajes-quirurgicos`, etc.; ver `ajustar_cuidados` en `tools/importar_wix.py`).

## Pendientes

- **WhatsApp:** en Wix los botones no tienen número. Se usa el teléfono de la tarjeta de presentación (999 956 6388); confirmar en `data/sitio.json`.
- **Tipografía:** Wix usa "aether" (licencia solo para sitios de Wix). Se usa Albert Sans, la libre más parecida, con el mismo interlineado.
- **Gráficos vectoriales de Wix** (palomita y tache dorados de la dieta FODMAP) no se importan. La señal de prohibido roja de los
  alimentos sí está: va dentro de la imagen que arma `tools/componer_imagenes.mjs`.
- **Mapa de contacto del inicio:** el extractor no lee el mapa de Google de Wix; se agrega en `agregar_mapa` de `tools/importar_wix.py` con la dirección de `mapaEmbed` en `data/sitio.json`. Su pin de Wix (imagen fija encima del mapa) se quitó.
- **Ortografía:** las faltas de los textos de Wix se corrigen en `CORRECCIONES` de `tools/importar_wix.py`, para que no regresen al volver a importar.
- **Carrusel de testimonios del inicio:** el extractor no lee los carruseles de Wix; sus tres diapositivas (fondos, citas y autores) están en `ajustar_inicio` de `tools/importar_wix.py` y se dibujan con `components/Carrusel.jsx`.
- **Páginas no incluidas:** la otra "Ingreso a cirugía" de Wix (`/paciente`: Acerca de tu visita y testimonios), Hospitales, Aviso de privacidad y Blog médico. El botón "Acerca de Mí" del inicio sigue omitido: en Wix no tiene enlace; ya podría llevar a `/sobre-mi/`.
