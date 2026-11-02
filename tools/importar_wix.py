"""Convierte la estructura extraída de Wix (data/wix/*.json, de tools/extraer_wix.mjs) en los datos de cada
página (data/paginas/<slug>.json) y descarga las imágenes a public/img/ en WebP.

Cada sección conserva la posición de cada elemento como en Wix (lienzo de 1440 px): x, y, ancho y alto.
Los elementos dentro de una caja se anidan para que en celular se acomoden en orden.

    FFMPEG=/ruta/ffmpeg python3 tools/importar_wix.py
"""
import hashlib, html, json, os, re, subprocess, urllib.request

RAIZ = os.path.join(os.path.dirname(__file__), '..')
WIX = os.path.join(RAIZ, 'data', 'wix')  # salida de tools/extraer_wix.mjs
SALIDA = os.path.join(RAIZ, 'data', 'paginas')
IMG = os.path.join(RAIZ, 'public', 'img')
FFMPEG = os.environ.get('FFMPEG', 'ffmpeg')
SITIO = json.load(open(os.path.join(RAIZ, 'data', 'sitio.json')))
WA = 'https://wa.me/' + SITIO['contacto']['whatsapp']
MAPA = SITIO['contacto']['mapa']

# Página de Wix -> ruta nueva
PAGINAS = {
    'home': '', 'servicios': 'servicios', 'about-1': 'piedras-en-la-vesicula-merida', 'coming-soon-03': 'cirugia-vesicula-merida',
    'copia-de-vesícula-biliar-e': 'hernias-merida', 'copia-de-vesícula-biliar-t': 'operacion-hernia-merida',
    'copia-de-vesícula-biliar-e-1': 'apendicitis-merida', 'copia-de-vesícula-biliar-t-1': 'cirugia-apendicitis-merida',
    'copia-de-vesícula-biliar-e-2': 'lipomas-merida', 'copia-de-vesícula-biliar-t-2': 'quistes-piel-merida',
    'copia-de-hernia-e': 'reflujo-gastroesofagico-merida', 'copia-de-hernia-t': 'cirugia-reflujo-gastroesofagico-merida',
    'copia-de-apendicitis-e': 'gastritis-merida', 'copia-de-apendicitis-e-1': 'cirugia-laparoscopica-merida',
    'copia-de-gastritis': 'colitis-merida', 'copia-de-gastritis-1': 'intestino-irritable-merida', 'copia-de-colitis': 'diarrea-y-estrenimiento-merida',
    'about-6-1': 'dietas-especiales', 'about-6': 'dieta-blanda', 'copia-de-dieta-blanda-1': 'dieta-para-estrenimiento',
    'copia-de-dieta-para-estreñimiento': 'dieta-para-diarrea', 'copia-de-dieta-para-diarrea': 'dieta-para-reflujo-y-gastritis',
    'copia-de-dieta-blanda': 'dieta-baja-en-fodmap',
}
OTRAS = {'contact-4': '/#contacto', 's-projects-basic': '/#preguntas-frecuentes'}
# Textos que en Wix son etiquetas de padecimientos junto a las ilustraciones: se vuelven enlaces
ETIQUETAS = {'Gastritis': 'gastritis-merida', 'Reflujo': 'reflujo-gastroesofagico-merida', 'Colitis': 'colitis-merida',
             'Intestino irritable': 'intestino-irritable-merida', 'Diarrea y Estreñimiento': 'diarrea-y-estrenimiento-merida',
             'Quistes': 'quistes-piel-merida', 'Lipomas': 'lipomas-merida'}
BOTON_CITA = '1da153_98e11fb3817743698389498ed9efc7d6~mv2.png'   # imagen de Wix con el botón "Agenda tu cita hoy"
PIN = '1da153_f140fe459f23461086f2fa25403aa81d~mv2.png'          # pin de ubicación (contacto)
ANCHO = 1440


def ruta(href):
    if not href: return ''
    if href.startswith(('http', 'mailto', 'tel')) and 'wixsite.com' not in href: return href
    s = urllib.request.unquote(href.split('cirugiamerida')[-1].strip('/'))
    if s in PAGINAS: return '/' + (PAGINAS[s] + '/' if PAGINAS[s] else '')
    return OTRAS.get(s, '')


descargadas = {}
def imagen(media):
    """Descarga la imagen de Wix (máx. 1600 px) y la guarda como WebP. Devuelve la ruta pública."""
    if not media: return ''
    if media in descargadas: return descargadas[media]
    nombre = 'w-' + hashlib.md5(media.encode()).hexdigest()[:10] + '.webp'
    destino = os.path.join(IMG, nombre)
    if not os.path.exists(destino):
        url = f'https://static.wixstatic.com/media/{media}/v1/fit/w_1600,h_1600,q_90/{media}'
        tmp = destino + '.src'
        urllib.request.urlretrieve(url, tmp)
        subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', tmp, '-c:v', 'libwebp', '-quality', '80', destino], check=True)
        os.remove(tmp)
    descargadas[media] = '/img/' + nombre
    return descargadas[media]


def estilos_parrafo(m):
    # data-f (tamaño), data-c (color), data-a (alineación), data-b (negrita) -> estilo en línea
    attrs = dict(re.findall(r'data-([fcab])="([^"]*)"', m.group(2)))
    st = []
    if 'f' in attrs:
        st.append(f'--f:{attrs["f"]}')
        if int(attrs['f']) >= 40: st.append('line-height:1.23')   # títulos grandes: interlineado de Wix
    if 'c' in attrs: st.append(f'color:{attrs["c"]}')
    if 'a' in attrs and attrs['a'] in ('center', 'right', 'end'): st.append('text-align:' + ('right' if attrs['a'] == 'end' else attrs['a']))
    if 'b' in attrs: st.append('font-weight:600')
    resto = re.sub(r'\s*data-[fcab]="[^"]*"', '', m.group(2))
    return f'<{m.group(1)}{resto}' + (f' style="{";".join(st)}"' if st else '') + '>'


def limpiar_html(h):
    h = re.sub(r'<(h[1-6]|p|li)((?:\s+[\w-]+="[^"]*")*)>', estilos_parrafo, h)
    h = re.sub(r'\s*\n\s*', '', h)
    h = h.replace('&nbsp;', ' ').replace(' ', ' ')
    # Renglones vacíos que Wix usa como espacio: se conservan con su tamaño de letra
    h = re.sub(r'<(h[1-6]|p)((?: style="[^"]*")?)>(?:\s|&nbsp;|\u00a0|<br\s*/?>|<(?:strong|b|em|i)>\s*</(?:strong|b|em|i)>)*</\1>', r'<p class="vacio"\2></p>', h)
    h = re.sub(r'<(h[1-6])>', r'<\1>', h)
    h = re.sub(r'<li([^>]*)><p[^>]*>(.*?)</p></li>', r'<li\1>\2</li>', h)
    h = h.replace('&nbsp;', ' ').replace('\u00a0', ' ')
    h = re.sub(r'<(strong|b)>\s*</\1>', '', h)
    return h.strip()


def respuesta(texto):
    partes = [p.strip() for p in re.split(r'\n\s*\n+', texto) if p.strip()]
    return ''.join(f'<p>{html.escape(p).replace(chr(10), "<br>")}</p>' for p in partes)


def contiene(c, it):
    # Un elemento pertenece a la caja que contiene su centro (en Wix las franjas pueden salirse de su caja)
    cx, cy = it['x'] + it['w'] / 2, it['y'] + it['h'] / 2
    return (it is not c and c['k'] == 'caja' and c['w'] * c['h'] > it['w'] * it['h']
            and c['x'] <= cx <= c['x'] + c['w'] and c['y'] <= cy <= c['y'] + c['h'])


def anidar(items):
    """Asigna id (orden de Wix) y padre (la caja más pequeña que contiene al elemento) a cada elemento."""
    for n, it in enumerate(items): it['id'] = n
    cajas = sorted([i for i in items if i['k'] == 'caja'], key=lambda c: c['w'] * c['h'])
    for it in items:
        padre = next((c for c in cajas if contiene(c, it)), None)
        it['padre'] = padre['id'] if padre else None


ROSA = 'rgb(242, 131, 130)'
def oscuro(rgb):
    m = re.findall(r'[\d.]+', rgb or '')
    if len(m) < 3 or (len(m) > 3 and float(m[3]) == 0): return False
    r, g, b = map(float, m[:3])
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45


def corregir_color(e, fondo):
    real = 'rgb(255, 255, 255)' if oscuro(fondo) else 'rgb(22, 60, 97)'
    e['html'] = e['html'].replace('color:' + ROSA, 'color:' + real)
    if e['color'] == ROSA: e['color'] = real


def convertir(wix_slug, datos):
    faq_pendientes = list(datos.get('faq', []))
    secciones = []
    for s in datos['secciones']:
        items = []
        for it in s['items']:
            e = {k: it[k] for k in ('k', 'x', 'y', 'w', 'h')}
            if it['k'] == 'texto':
                e.update(html=limpiar_html(it['html']), fs=it['fs'], color=it['color'], align=it['align'])
                # Enlaces dentro del texto: de las páginas de Wix a las rutas nuevas
                e['html'] = re.sub(r'href="([^"]*)"', lambda m: f'href="{ruta(html.unescape(m.group(1))) or "#"}"', e['html'])
                plano = re.sub(r'<[^>]+>', '', e['html']).strip()
                if plano in ETIQUETAS:
                    e['enlace'] = '/' + ETIQUETAS[plano] + '/'
                    e['html'] = re.sub(r'</?a\b[^>]*>', '', e['html'])
                if not plano: continue
            elif it['k'] == 'img':
                if it['src'] == BOTON_CITA:
                    e.update(k='btn', t='Agenda tu cita hoy', href=WA, tipo='cita')
                else:
                    e.update(src=imagen(it['src']), alt=it['alt'] if not re.match(r'^(ChatGPT|Imagen de ChatGPT|IMG_|p$|_A)', it['alt'] or '') else '',
                             fit=it.get('fit') or 'cover', rad=it.get('rad', '0px'))
                    if it['src'] == PIN: e['href'] = MAPA
                    elif it.get('link'): e['href'] = ruta(it['link'])
            elif it['k'] == 'btn':
                destino = ruta(it.get('href', ''))
                e.update(t=it['t'], href=destino)
                if not destino and it['t'] == 'Ver padecimientos': e['tipo'] = 'desplegable'
                elif not destino and 'whats' in it['t'].lower(): e['href'] = WA
                elif not destino: continue   # "Acerca de Mí" y otros sin página todavía
            elif it['k'] == 'caja':
                e.update(bg=it['bg'], bimg=imagen(it.get('bimg', '')), rad=it.get('rad', '0px'), borde=it.get('borde', ''))
            elif it['k'] == 'linea':
                e.update(color=it.get('color') or '')
            elif it['k'] == 'faq':
                n = len(faq_pendientes)
                e['preguntas'] = [{'p': q['q'], 'r': respuesta(q['a'])} for q in faq_pendientes]
                faq_pendientes = []
                if not n: continue
            items.append(e)
        anidar(items)
        for it in items:
            if it['k'] == 'texto':
                fondo = items[it['padre']]['bg'] if it['padre'] is not None else s['bg']
                if fondo in ('', 'rgba(0, 0, 0, 0)') and s.get('bgImg'): fondo = 'rgb(20, 40, 60)'
                corregir_color(it, fondo)
                # Texto blanco sobre fondo claro: en Wix lleva una franja oscura detrás (p. ej. pies de foto)
                colores = re.findall(r'color:(rgb\([^)]*\))', it['html'])
                blanco = colores and all(not oscuro(c) and sum(map(float, re.findall(r'[\d.]+', c)[:3])) > 740 for c in colores)
                sobre_imagen = any(o['k'] == 'img' and o['x'] < it['x'] + it['w'] and it['x'] < o['x'] + o['w'] and o['y'] < it['y'] + it['h'] and it['y'] < o['y'] + o['h'] for o in items)
                if blanco and not oscuro(fondo) and not s.get('bgImg') and not sobre_imagen and not it.get('enlace'):
                    it['fondo'] = True
        sec = {'h': s['h'], 'bg': s['bg'], 'bgImg': imagen(s.get('bgImg', '')), 'items': items}
        # Foto de fondo con texto oscuro encima: en Wix lleva un velo blanco translúcido para que se lea
        textos_sueltos = [i for i in items if i['k'] == 'texto' and i['padre'] is None]
        if sec['bgImg'] and textos_sueltos and all(oscuro(c) for i in textos_sueltos for c in re.findall(r'color:(rgb\([^)]*\))', i['html'])):
            sec['velo'] = True
        secciones.append(sec)
    # Botones "Ver padecimientos": enlaces de las etiquetas de su misma caja
    for s in secciones:
        for b in s['items']:
            if b.get('tipo') != 'desplegable': continue
            hermanos = [i for i in s['items'] if i.get('padre') == b['padre'] and i.get('enlace')]
            b['opciones'] = [{'t': re.sub(r'<[^>]+>', '', i['html']), 'href': i['enlace']} for i in hermanos]
    return secciones


def ajustar_inicio(secciones):
    """Mejoras de diseño del inicio sobre la posición de Wix (se aplican después de agregar el héroe)."""
    # Héroe: la foto (1600×785) ocupa toda la sección con su proporción completa, sin franja vacía debajo;
    # los textos y el botón de cita quedan en un bloque alineado a la derecha, dentro de la foto.
    s0 = secciones[0]
    s0['h'] = round(ANCHO * 785 / 1600)
    posiciones = {'Cirujano General': (560, 118), 'Alta Especialidad': (458, 281), 'Atención médica': (543, 416)}
    for it in s0['items']:
        if it.get('heroe'): it['h'] = s0['h']
        elif it['k'] == 'btn': it['x'], it['y'] = 876, 492
        elif it['k'] == 'texto':
            for inicio, (x, y) in posiciones.items():
                if inicio in it['html']: it['x'], it['y'] = x, y
    # Padecimientos: fondo continuo detrás del título y título "Enfermedades del estómago" en un renglón
    s1 = secciones[1]
    s1['bg'] = 'rgb(247, 247, 244)'
    for it in s1['items']:
        if it['k'] == 'texto' and 'Enfermedades del estómago' in it['html']: it['x'], it['w'] = 44, 560
        # "Ver padecimientos" del colon: su subtítulo ocupa dos renglones, se separa un poco
        if it.get('tipo') == 'desplegable' and it['x'] > ANCHO / 2: it['y'] += 14
    # Tarjeta de quistes y lipomas: en Wix tiene botón "Más información" (con sus dos páginas)
    quistes = next(i for i in s1['items'] if i['k'] == 'texto' and 'Quistes, Lipomas' in i['html'])
    opciones = [{'t': re.sub(r'<[^>]+>', '', i['html']), 'href': i['enlace']} for i in s1['items'] if i.get('padre') == quistes['padre'] and i.get('enlace')]
    s1['items'].append({'k': 'btn', 'x': 1042, 'y': 2296, 'w': 153, 'h': 36, 't': 'Más información', 'href': '', 'tipo': 'desplegable', 'opciones': opciones})
    anidar(s1['items'])
    # Testimonio centrado, como en Wix
    for it in secciones[6]['items']:
        if it['k'] == 'texto' and 'excelente ser humano' in it['html']: it['align'] = 'center'


if __name__ == '__main__':
    os.makedirs(SALIDA, exist_ok=True); os.makedirs(IMG, exist_ok=True)
    for f in sorted(os.listdir(WIX)):
        wix_slug = urllib.request.unquote(f[:-5])
        slug = PAGINAS[wix_slug]
        datos = json.load(open(os.path.join(WIX, f)))
        secciones = convertir(wix_slug, datos)
        if wix_slug == 'home':
            # El héroe de Wix es una galería en iframe: se agregan su imagen y su título en la misma posición.
            s0 = secciones[0]
            s0['items'][:0] = [{'k': 'img', 'x': 0, 'y': 0, 'w': ANCHO, 'h': 452, 'src': imagen('1da153_efde536ee79c4012afc6f6f01d95daee~mv2.jpg'),
                                'alt': 'Cirujano en quirófano', 'fit': 'cover', 'rad': '0px', 'heroe': True},
                               {'k': 'texto', 'x': 560, 'y': 30, 'w': 653, 'h': 150, 'fs': 50, 'color': 'rgb(255, 255, 255)', 'align': 'right',
                                'html': '<h1 style="--f:50;line-height:1.23">Cirujano General<br>Certificado en Mérida</h1>'}]
            # Comillas del testimonio (en Wix son un gráfico vectorial)
            s6 = secciones[6]
            s6['items'].append({'k': 'texto', 'x': 670, 'y': 120, 'w': 100, 'h': 110, 'fs': 120, 'color': 'rgb(255, 255, 255)', 'align': 'center',
                                'html': '<p style="--f:120;color:rgb(255, 255, 255);text-align:center">“</p>', 'comillas': True})
            anidar(s0['items']); anidar(s6['items'])
            for it in s0['items']:
                if it['k'] == 'texto' and it['y'] > 150:
                    it['color'] = 'rgb(255, 255, 255)'; it['align'] = 'right'; it.pop('fondo', None)   # van sobre la foto del héroe
                if it.get('padre') is None and it['k'] != 'img': it['padre'] = None
            ajustar_inicio(secciones)
        with open(os.path.join(SALIDA, (slug or 'inicio') + '.json'), 'w', encoding='utf-8') as fh:
            json.dump({'slug': slug, 'wix': wix_slug, 'secciones': secciones}, fh, ensure_ascii=False)
        print(f'{slug or "inicio":42} {len(secciones):3} secciones {sum(len(s["items"]) for s in secciones):4} elementos')
    print(len(descargadas), 'imágenes')
