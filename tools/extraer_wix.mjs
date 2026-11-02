// Wix layout extractor: for each top-level section, every box, rich text, image, button and line with its exact
// position (x/w in px of a 1440 canvas, y/h in px from the section top) and styles. FAQ answers are read by opening each item.
import { createRequire } from 'module'; import os from 'os'; import path from 'path'; import fs from 'fs';
const require = createRequire(path.join(os.homedir(), '.claude/skills/reel/scripts/node_modules/x.js'));
const puppeteer = require('puppeteer-core');
const [out, ...slugs] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
for (const slug of slugs) {
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
  await p.goto('https://joeldorantes.wixsite.com/cirugiamerida/' + slug, { waitUntil: 'networkidle2', timeout: 120000 });
  for (let y = 0; y < 16000; y += 500) { await p.evaluate(y => scrollTo(0, y), y); await new Promise(r => setTimeout(r, 100)); }
  // Open accordions to read the answers
  const faq = await p.evaluate(async () => {
    const res = []; const items = [...document.querySelectorAll('[data-hook="accordion-item"], [data-testid*="accordion" i] [role="button"], [aria-expanded]')].filter(e => e.getAttribute('aria-expanded') === 'false' && e.innerText.trim().endsWith('?'));
    for (const it of items) {
      const before = document.body.innerText; it.click(); await new Promise(r => setTimeout(r, 500));
      const ctl = it.getAttribute('aria-controls'); const panel = ctl ? document.getElementById(ctl) : null;
      res.push({ q: it.innerText.trim(), a: panel ? panel.innerText.trim() : '', ah: panel ? panel.innerHTML : '' });
    }
    return res;
  });
  await p.evaluate(() => scrollTo(0, 0));
  const est = await p.evaluate(() => {
    const limpiar = el => {
      // Tamaño, color, peso y alineación de cada párrafo (en Wix un mismo bloque mezcla estilos)
      el.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li').forEach(b => {
        const sp = [...b.querySelectorAll('span')].find(s => s.textContent.trim() && !s.querySelector('span')) || b;
        const cs = getComputedStyle(sp);
        b.setAttribute('data-f', Math.round(parseFloat(cs.fontSize))); b.setAttribute('data-c', cs.color);
        b.setAttribute('data-a', getComputedStyle(b).textAlign);
        if (+cs.fontWeight >= 600) b.setAttribute('data-b', '1');
      });
      const c = el.cloneNode(true);
      c.querySelectorAll('*').forEach(n => {
        const keep = ['H1','H2','H3','H4','H5','H6','P','UL','OL','LI','STRONG','B','EM','I','A','BR','SPAN'];
        if (!keep.includes(n.tagName)) { n.replaceWith(...n.childNodes); return; }
        const fw = n.style && n.style.fontWeight; const st = {};
        [...n.attributes].forEach(a => { if (!['href', 'data-f', 'data-c', 'data-a', 'data-b'].includes(a.name)) n.removeAttribute(a.name); });
        if (n.tagName === 'SPAN') { if (fw && +fw >= 600) { const s = document.createElement('strong'); s.append(...n.childNodes); n.replaceWith(s); } else n.replaceWith(...n.childNodes); }
      });
      return c.innerHTML.replace(/​/g, '').replace(/<p>\s*<\/p>/g, '<p class="vacio"></p>');
    };
    const secs = [...document.querySelectorAll('#SITE_PAGES section')].filter(s => !s.parentElement.closest('section'));
    return secs.map(s => {
      const R = s.getBoundingClientRect(), top = R.top + scrollY, left = R.left;
      const pos = el => { const q = el.getBoundingClientRect(); return { x: Math.round(q.left - left), y: Math.round(q.top + scrollY - top), w: Math.round(q.width), h: Math.round(q.height) }; };
      const st = el => getComputedStyle(el);
      const bgEl = s.querySelector(':scope > [data-testid="section-bg"] [data-testid="colorUnderlay"], [id^="bgLayers"] [data-testid="colorUnderlay"]');
      const bgImg = s.querySelector('[id^="bgLayers"] img, [data-testid="bgMedia"] img');
      const items = [];
      s.querySelectorAll('[id^="comp-"]').forEach(c => {
        if (c.closest('[id^="bgLayers"]')) return;
        const tid = c.getAttribute('data-testid') || '', cls = c.className?.baseVal ?? c.className ?? '';
        const r = pos(c); if (r.w < 4 || r.h < 2) return;
        const rt = c.querySelector(':scope > [data-testid="richTextElement"]') || (tid === 'richTextElement' ? c : null);
        if (rt && !c.closest('[data-hook]')) {
          const f = rt.querySelector('h1,h2,h3,h4,h5,h6,p,li') || rt; const fs2 = rt.querySelector('span[style*="font-size"]');
          const cs = st(fs2 || f);
          items.push({ k: 'texto', ...r, html: limpiar(rt), fs: parseFloat(cs.fontSize), lh: cs.lineHeight, color: cs.color, align: st(f).textAlign, fw: cs.fontWeight, ls: cs.letterSpacing });
          return;
        }
        if (/wixui-image|wixui-photo/.test(cls) || c.querySelector(':scope > wow-image, :scope > div > wow-image, :scope [data-testid="imageX"]')) {
          const im = c.querySelector('img'); if (!im || c.querySelector('[id^="comp-"] img') && c.querySelector('[id^="comp-"] img') !== im && c.querySelector('[id^="comp-"]')) return;
          items.push({ k: 'img', ...r, src: (im.currentSrc || im.src || '').split('/v1/')[0].split('/').pop(), alt: im.alt, fit: st(im).objectFit, rad: st(c).borderRadius !== '0px' ? st(c).borderRadius : st(im).borderRadius, link: c.closest('a')?.getAttribute('href') || '' });
          return;
        }
        const broot = c.querySelector(':scope > a[class*="StylableButton"], :scope > button[class*="StylableButton"], :scope > a[data-testid="linkElement"]:not([href*="wixsite"]):not(:has(img))');
        if (broot || /wixui-button/i.test(cls)) {
          const a = broot || c.querySelector('a') || c; const lbl = c.querySelector('[data-testid="stylablebutton-label"], span') || c;
          const cs = st(broot || c);
          if (!c.innerText.trim()) return;
          items.push({ k: 'btn', ...r, t: c.innerText.trim(), href: (a.getAttribute && a.getAttribute('href')) || '', bg: cs.backgroundColor, color: st(lbl).color, borde: cs.borderTopWidth + ' ' + cs.borderTopColor, rad: cs.borderTopLeftRadius, fs: parseFloat(st(lbl).fontSize), icono: !!c.querySelector('svg') });
          return;
        }
        if (/horizontal-line|vertical-line|wixui-divider/i.test(cls)) { items.push({ k: 'linea', ...r, color: st(c.querySelector('*') || c).borderTopColor || st(c).backgroundColor }); return; }
        const bgc = st(c).backgroundColor; const box = c.querySelector(':scope > [data-testid="container-bg"], :scope > div > [data-testid="colorUnderlay"]');
        const bc = box ? st(box).backgroundColor : bgc;
        const bimg = c.querySelector(':scope > [id^="bgLayers"] img, :scope > div > [id^="bgLayers"] img');
        if ((bc && bc !== 'rgba(0, 0, 0, 0)' || bimg) && r.w > 60 && r.h > 40 && !c.matches('[data-testid="richTextElement"]')) {
          const bs = box ? st(box) : st(c);
          items.push({ k: 'caja', ...r, bg: bc, bimg: bimg ? (bimg.currentSrc || '').split('/v1/')[0].split('/').pop() : '', rad: bs.borderTopLeftRadius, borde: bs.borderTopWidth !== '0px' ? bs.borderTopWidth + ' ' + bs.borderTopColor : '', sombra: bs.boxShadow !== 'none' ? 1 : 0 });
        }
        if (/wixui-collapsible|wixui-accordion|ExpandableMenu|repeater/i.test(cls) || c.querySelector(':scope [aria-expanded]') && !items.some(i => i.k === 'faq')) {
          if (c.querySelector('[aria-expanded]') && !c.parentElement.closest('[id^="comp-"] [aria-expanded]')) items.push({ k: 'faq', ...r });
        }
      });
      const uniq = items.filter((it, i) => items.findIndex(o => o.k === it.k && o.x === it.x && o.y === it.y && o.w === it.w && o.h === it.h) === i);
      return { top: Math.round(top), h: Math.round(R.height), w: Math.round(R.width), bg: bgEl ? st(bgEl).backgroundColor : '', bgImg: bgImg ? (bgImg.currentSrc || '').split('/v1/')[0].split('/').pop() : '', items: uniq };
    }).filter(s => s.h > 20);
  });
  fs.writeFileSync(path.join(out, (slug || 'home') + '.json'), JSON.stringify({ secciones: est, faq }, null, 1));
  console.log(slug || 'home', est.length, 'secciones', est.reduce((a, s) => a + s.items.length, 0), 'elementos', faq.length, 'faq');
  await p.close();
}
await b.close();
