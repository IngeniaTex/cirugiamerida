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
    'copia-de-dieta-blanda': 'dieta-baja-en-fodmap', 'copia-de-inicio': 'pacientes',
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


# Nombre de cada imagen: el de su original en la carpeta IMAGENES (data/imagenes.json); si no está, uno provisional
NOMBRES = json.load(open(os.path.join(RAIZ, 'data', 'imagenes.json')))['imagenes']
descargadas = {}
def imagen(media):
    """Descarga la imagen de Wix (máx. 1600 px) y la guarda como WebP. Devuelve la ruta pública."""
    if not media: return ''
    if media in descargadas: return descargadas[media]
    nombre = NOMBRES.get(media) or 'w-' + hashlib.md5(media.encode()).hexdigest()[:10] + '.webp'
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
        # La misma foto de fondo de la sección y de una de sus cajas: en escritorio la caja la tapa, pero en tablet y
        # celular (las cajas se vuelven tarjetas) se vería dos veces, una encima de la otra
        if sec['bgImg'] and any(i.get('bimg') == sec['bgImg'] for i in items):
            sec['fondoRepetido'] = True
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
        if it.get('tipo') == 'desplegable' and it['x'] > ANCHO / 2: it['y'] += 4
    # Tarjeta de quistes y lipomas: en Wix tiene botón "Más información" (con sus dos páginas)
    quistes = next(i for i in s1['items'] if i['k'] == 'texto' and 'Quistes, Lipomas' in i['html'])
    opciones = [{'t': re.sub(r'<[^>]+>', '', i['html']), 'href': i['enlace']} for i in s1['items'] if i.get('padre') == quistes['padre'] and i.get('enlace')]
    s1['items'].append({'k': 'btn', 'x': 1042, 'y': 2296, 'w': 153, 'h': 36, 't': 'Más información', 'href': '', 'tipo': 'desplegable', 'opciones': opciones})
    anidar(s1['items'])
    # Instrumento de cirugía laparoscópica: más pequeño y completo (contain), para que el efecto al pasar el cursor no lo recorte
    for it in secciones[3]['items']:
        if it['k'] == 'img' and it['w'] > 1000: it.update(x=188, w=940, fit='contain')
        # Sus botones, alineados a la izquierda con la columna de texto (en Wix van a la derecha): "Más información" bajo
        # el primer bloque y la cita bajo la pregunta final (el botón de cita ocupa el 80 % central de su caja)
        if it['k'] == 'btn' and it.get('tipo') != 'cita': it.update(x=192, y=545, alinear='izq')
        if it.get('tipo') == 'cita': it.update(x=round(192 - it['w'] * .1), y=1888)
    # Testimonios: en Wix es un carrusel (slideshow) de tres diapositivas que el extractor no lee; se arma aquí con
    # sus fondos, textos y autores. Ocupa el lugar del carrusel de Wix (a todo lo ancho, 28 px bajo el borde de la sección).
    s6 = secciones[6]
    s6.update(bg='rgba(0, 0, 0, 0)', bgImg='')
    s6['items'] = [{'k': 'carrusel', 'x': 0, 'y': 28, 'w': ANCHO, 'h': 647, 'id': 0, 'padre': None, 'diapositivas': [
        {'img': imagen('1da153_ac922e1b481d4750919f449831151fa5~mv2.jpg'), 'tono': 'oscuro', 'autor': 'M. Pérez',
         'cita': '"Un excelente ser humano y gran <br>profesionista que se prepara día a día. <br>Altamente recomendado"'},
        {'img': imagen('1da153_c525313b38034ff897da1b9ab583f6ab~mv2.png'), 'alt': 'Médico conversando con una paciente en su habitación del hospital'},
        {'img': imagen('1da153_35e96de349b84dd489e5ba3416f24d50~mv2.jpg'), 'tono': 'claro', 'autor': 'G. Izquierdo',
         'cita': 'No cabe duda, uno de los mejores <br>Cirujanos, muy recomendable.'},
    ]}]
    # Sección de contacto: destino de la opción "Contacto" del menú (/#contacto)
    secciones[7]['ancla'] = 'contacto'


def ajustar_servicios(secciones):
    """Elementos que en Wix quedan tapados (no se ven en escritorio, pero en celular sí aparecerían): los botones
    "Más información" y "Tratamiento" de cirugía laparoscópica bajo su foto, y la vesícula grande bajo su tarjeta."""
    s1 = secciones[1]
    fotos = [i for i in s1['items'] if i['k'] == 'img']
    tapado = lambda b: any(f['id'] > b['id'] and f['x'] <= b['x'] + b['w'] / 2 <= f['x'] + f['w'] and f['y'] <= b['y'] + b['h'] / 2 <= f['y'] + f['h'] for f in fotos)
    cajas = [c for c in s1['items'] if c['k'] == 'caja' and c['bg'].startswith('rgb(')]
    bajo_caja = lambda im: any(c['id'] > im['id'] and c['x'] <= im['x'] and c['y'] <= im['y'] and im['x'] + im['w'] <= c['x'] + c['w']
                               and im['y'] + im['h'] <= c['y'] + c['h'] for c in cajas)
    s1['items'] = [i for i in s1['items'] if not (i['k'] == 'btn' and tapado(i)) and not (i['k'] == 'img' and bajo_caja(i))]
    anidar(s1['items'])


def ajustar_pacientes(secciones):
    """Ingreso a cirugía: en Wix solo dos frases de las recomendaciones van en negritas (el extractor marca todo el bloque)."""
    for it in secciones[0]['items']:
        if it['k'] == 'texto' and 'agradeceremos' in it['html']:
            it['html'] = it['html'].replace(';font-weight:600', '')
            for frase in ('Tener como mínimo 8 horas de ayuno total, incluyendo ingesta de líquidos, a menos que haya recibido otra indicación de su médico tratante.',
                          'pregunte a su médico si debe suspender algún medicamento.'):
                it['html'] = it['html'].replace(frase, f'<strong>{frase}</strong>')


def quitar_foto_oculta(seccion):
    """Héroe de piedras en la vesícula y lipomas: en Wix la foto de la mujer de suéter va de fondo de la sección y de la
    columna derecha, pero en escritorio la tapan la caja oscura y la blanca (solo asoman dos franjas grises a los lados);
    en celular sí se vería. Se quita y las franjas quedan de ese gris. La ilustración va dentro de la columna blanca,
    para que en celular quede sobre fondo blanco (se desvanece hacia abajo en blanco)."""
    seccion['bgImg'] = ''
    gris = next(c for c in seccion['items'] if c['k'] == 'caja' and c['bimg'])
    blanca = next(c for c in seccion['items'] if c['k'] == 'caja' and c['padre'] == gris['id'])
    gris.update(bimg='', bg='rgb(180, 178, 173)')
    blanca['padre'] = gris['padre']   # la gris queda vacía: en celular no se dibuja
    for im in seccion['items']:
        if im['k'] == 'img': im['padre'] = blanca['id']


def ajustar_piedras(secciones):
    quitar_foto_oculta(secciones[0])
    # ¿Qué opciones de tratamiento existen?: la foto del quirófano va alineada a la derecha como en Wix (se ven el
    # monitor y los instrumentos)
    next(c for c in secciones[8]['items'] if c['k'] == 'caja' and c['bimg'])['pos'] = '100% 50%'


COMPOSICIONES = json.load(open(os.path.join(RAIZ, 'data', 'composiciones.json')))['composiciones']


def unir_fotos(secciones, slug):
    """Fotos encimadas que van mejor como una sola imagen (p. ej. "¿Qué alimentos pueden empeorar…?", con la señal de
    prohibido de Wix): se cambian por la que arma tools/componer_imagenes.mjs, en el mismo lugar (data/composiciones.json)."""
    for comp in COMPOSICIONES:
        if slug not in comp['paginas']: continue
        for s in secciones:
            fotos = [i for i in s['items'] if i['k'] == 'img' and i['src'][5:-5] in [f[0] for f in comp['fotos']]]
            if len(fotos) != len(comp['fotos']): continue
            # El grupo puede estar corrido respecto a la página de referencia
            ref = next(f for f in comp['fotos'] if f[0] == fotos[0]['src'][5:-5])
            dx, dy = fotos[0]['x'] - ref[1], fotos[0]['y'] - ref[2]
            cx, cy, lado = comp['cruz']
            cajas = [f[1:] for f in comp['fotos']] + [[cx, cy, lado, lado]]
            x, y = min(c[0] for c in cajas), min(c[1] for c in cajas)
            # Va en la tarjeta blanca de afuera, no en la franja azul que la cruza
            por_id = {c['id']: c for c in s['items']}
            caja = por_id[fotos[0]['padre']]
            while caja['padre'] is not None: caja = por_id[caja['padre']]
            primera = min(fotos, key=lambda f: f['id'])
            primera.update(x=x + dx, y=y + dy, w=max(c[0] + c[2] for c in cajas) - x, h=max(c[1] + c[3] for c in cajas) - y,
                           src='/img/' + comp['archivo'] + '.webp', alt=comp['alt'], fit='contain', padre=caja['id'])
            s['items'] = [i for i in s['items'] if i not in fotos or i is primera]


def alinear_botones_izquierda(secciones):
    """Botón solo debajo de un texto alineado a la izquierda de su misma caja, pero corrido a la derecha (así quedó en
    Wix): se alinea con el inicio del texto. Devuelve los botones movidos (para revisar)."""
    movidos = []
    for s in secciones:
        for b in s['items']:
            if b['k'] != 'btn' or b.get('alinear') or b.get('tipo') == 'desplegable': continue
            if any(o is not b and o['k'] == 'btn' and o['padre'] == b['padre'] and abs(o['y'] + o['h'] / 2 - (b['y'] + b['h'] / 2)) < 30 for o in s['items']):
                continue   # botones en pareja: se acomodan juntos
            cita = b.get('tipo') == 'cita'
            bx, by = (b['x'] + b['w'] * .1, b['y'] + b['h'] * .29) if cita else (b['x'], b['y'])   # el de cita ocupa el centro de su caja
            arriba = [t for t in s['items'] if t['k'] == 'texto' and t['padre'] == b['padre'] and not t.get('enlace')
                      and t['y'] + t['h'] <= by + 10 and by - (t['y'] + t['h']) < 200 and t['x'] < bx + b['w'] and bx < t['x'] + t['w']]
            if not arriba: continue
            t = max(arriba, key=lambda t: t['y'] + t['h'])
            if t['align'] not in ('start', 'left', 'justify') or 'text-align:center' in t['html'] or bx - t['x'] < 40: continue
            if t['fs'] >= 28: continue   # bajo un título corto (p. ej. "Ver dieta"): va centrado con él
            ancho = b['w'] * .8 if cita else b['w']
            if abs(bx + ancho / 2 - (t['x'] + t['w'] / 2)) <= 50: continue   # ya está centrado con su párrafo
            b['x'] = round(t['x'] - b['w'] * .1) if cita else t['x']
            b['alinear'] = 'izq'
            movidos.append((b.get('t'), round(bx), '->', t['x']))
    return movidos


def juntar_botones_finales(secciones):
    """Secciones con un botón y el de cita en el mismo renglón pero en extremos opuestos (cierre de las páginas de
    padecimientos): se juntan en una pareja centrada bajo su texto."""
    for s in secciones:
        botones = [b for b in s['items'] if b['k'] == 'btn' and b.get('tipo') != 'cita']
        citas = [b for b in s['items'] if b.get('tipo') == 'cita']
        if len(botones) != 1 or len(citas) != 1: continue
        b, c = botones[0], citas[0]
        if abs(b['y'] + b['h'] / 2 - (c['y'] + c['h'] / 2)) > 20 or abs(b['x'] - c['x']) < 500: continue
        textos = [t for t in s['items'] if t['k'] == 'texto' and t['y'] + t['h'] <= b['y'] and t['align'] == 'center']
        centro = max(textos, key=lambda t: t['y'])['x'] + max(textos, key=lambda t: t['y'])['w'] / 2 if textos else ANCHO / 2
        b['x'] = round(centro - 16 - b['w'])
        b['alinear'] = 'der'   # si su texto es más ancho que en Wix, crece hacia la izquierda y no toca al de cita
        c['x'] = round(centro + 16 - c['w'] * .1)   # el botón de cita ocupa el 80 % central de su caja


def texto_plano(it):
    return re.sub(r'<[^>]+>', '', it.get('html', '')).strip()


def centrar_botones(seccion, centros):
    """Centra los botones de cada tarjeta con su título y subtítulo. `centros`: título de la tarjeta -> centro (en px del
    lienzo) medido en el sitio ya publicado, porque el texto de Wix suele no estar centrado en su caja."""
    for titulo, centro in centros.items():
        caja = next(i['padre'] for i in seccion['items'] if i['k'] == 'texto' and texto_plano(i).startswith(titulo))
        filas = {}
        for b in seccion['items']:
            if b['k'] == 'btn' and b['padre'] == caja: filas.setdefault(round(b['y'] / 12), []).append(b)
        for botones in filas.values():
            x1, x2 = min(b['x'] for b in botones), max(b['x'] + b['w'] for b in botones)
            for b in botones: b['x'] = round(b['x'] + centro - (x1 + x2) / 2)
            # La ilustración de abajo baja (sin cambiar de tamaño) para dejar aire bajo los botones (38 px de alto en el
            # sitio), siempre que siga cabiendo en su tarjeta
            abajo = max(b['y'] + max(b['h'], 38) for b in botones) + 12
            x1, x2 = min(b['x'] for b in botones), max(b['x'] + b['w'] for b in botones)
            c = next(i for i in seccion['items'] if i['id'] == caja)
            for img in seccion['items']:
                if (img['k'] == 'img' and img['padre'] == caja and botones[0]['y'] <= img['y'] < abajo and img['x'] < x2 and x1 < img['x'] + img['w']
                        and abajo + img['h'] <= c['y'] + c['h']):
                    img['y'] = abajo


CENTROS = {
    'inicio': {'VESICULA BILIAR': 936, 'HERNIAS': 498, 'Enfermedades del estómago': 332, 'Enfermedades del colon': 1108,
               'Apendicitis Aguda': 310, 'Quistes, Lipomas': 1108},
    'servicios': {'Vesícula biliar': 257, 'Hernias': 1054, 'Enfermedades del estómago': 265, 'Enfermedades del colon': 1035,
                  'Apendicitis aguda': 246, 'Quistes y Lipomas': 1049, 'Cirugía Laparoscópica': 693},
}


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
            anidar(s0['items'])
            for it in s0['items']:
                if it['k'] == 'texto' and it['y'] > 150:
                    it['color'] = 'rgb(255, 255, 255)'; it['align'] = 'right'; it.pop('fondo', None)   # van sobre la foto del héroe
                if it.get('padre') is None and it['k'] != 'img': it['padre'] = None
            ajustar_inicio(secciones)
        if slug == 'servicios': ajustar_servicios(secciones)
        if slug == 'pacientes': ajustar_pacientes(secciones)
        if slug == 'piedras-en-la-vesicula-merida': ajustar_piedras(secciones)
        if slug == 'lipomas-merida': quitar_foto_oculta(secciones[0])
        unir_fotos(secciones, slug)
        juntar_botones_finales(secciones)
        alinear_botones_izquierda(secciones)
        if (slug or 'inicio') in CENTROS: centrar_botones(secciones[1], CENTROS[slug or 'inicio'])
        with open(os.path.join(SALIDA, (slug or 'inicio') + '.json'), 'w', encoding='utf-8') as fh:
            json.dump({'slug': slug, 'wix': wix_slug, 'secciones': secciones}, fh, ensure_ascii=False)
        print(f'{slug or "inicio":42} {len(secciones):3} secciones {sum(len(s["items"]) for s in secciones):4} elementos')
    print(len(descargadas), 'imágenes')
