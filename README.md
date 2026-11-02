# cirugiamerida.com — Next.js

Réplica del sitio publicado en https://joeldorantes.wixsite.com/cirugiamerida (Inicio, Servicios con sus padecimientos
y tratamientos, y Dietas especiales con sus dietas), con los **textos e imágenes en la misma posición que en Wix**, los mismos
colores y mejoras de diseño: encabezado fijo que se compacta, menú lateral en celular, animaciones al aparecer, acordeón
animado en preguntas frecuentes, botón flotante de WhatsApp, efectos al pasar el cursor y versión adaptada a celular.

Next.js 16 (App Router) con exportación estática: `npm run build` genera la carpeta `out/`, lista para cualquier hosting
(Cloudflare Pages, Vercel, Netlify o un hosting tradicional).

## Uso

```bash
npm install
npm run dev      # desarrollo en http://localhost:3000
npm run build    # genera out/
npm start        # sirve out/ en http://localhost:4322
```

Requiere Node 20.9 o superior.

## Cómo funciona

Wix acomoda cada elemento en un lienzo de 1440 px. Este sitio guarda esa misma posición:

1. `tools/extraer_wix.mjs` lee cada página publicada en Wix y guarda en `data/wix/` cada sección con sus cajas de color,
   textos (con tamaño, color y alineación de cada párrafo), imágenes, botones, líneas y preguntas frecuentes (con sus respuestas).
2. `tools/importar_wix.py` convierte esa estructura en `data/paginas/<ruta>.json`: cambia los enlaces de Wix por las rutas
   nuevas, convierte las imágenes-botón de Wix en botones reales, agrupa cada elemento dentro de su caja (para celular) y
   descarga las imágenes a `public/img/` en WebP.
3. `components/Seccion.jsx` dibuja cada sección:
   - **Escritorio (≥1200 px):** cada elemento en su posición de Wix, escalada al ancho de la ventana y pintada en el mismo orden.
   - **Tablet y celular:** cada caja envuelve a sus elementos y todo se acomoda de arriba a abajo.

Para volver a importar después de cambiar algo en Wix:

```bash
node tools/extraer_wix.mjs data/wix "" servicios about-1 …     # páginas de Wix (requiere puppeteer-core y Chrome)
FFMPEG=/ruta/ffmpeg python3 tools/importar_wix.py
```

## Archivos

| Archivo | Qué contiene |
| --- | --- |
| `data/paginas/*.json` | Secciones y elementos de cada página (textos editables en `html`) |
| `data/sitio.json` | Teléfonos, WhatsApp, correo, dirección y pie de página |
| `data/paginas.json` | Menú, metatítulos y metadescripciones (de `METATITULOS.docx` y de cada bloque) |
| `app/globals.css` | Colores, tipografía, lienzo de Wix, botones, preguntas frecuentes y versión celular |
| `components/` | Encabezado, pie, sección, preguntas frecuentes, desplegable "Ver padecimientos" |

## Rutas

Las direcciones son las que propone `METATITULOS.docx`: `/hernias-merida/`, `/cirugia-vesicula-merida/`, `/dieta-blanda/`, etc.
Las páginas de tratamiento (cirugía de vesícula, operación de hernia, cirugía de apendicitis, cirugía para reflujo) no aparecen
en el menú, igual que en Wix.

## Pendientes

- **WhatsApp:** en Wix los botones no tienen número. Se usa el teléfono de la tarjeta de presentación (999 956 6388); confirmar en `data/sitio.json`.
- **Tipografía:** Wix usa "aether" (licencia solo para sitios de Wix). Se usa Albert Sans, la libre más parecida, con el mismo interlineado.
- **Gráficos vectoriales de Wix** (palomita y tache dorados de la dieta FODMAP, flechas del carrusel de testimonios) no se importan; las comillas del testimonio se agregaron.
- **Páginas no incluidas:** Acerca de, Ingreso a cirugía, Hospitales, Aviso de privacidad y Blog médico. El botón "Acerca de Mí" se omitió hasta que exista su página.
