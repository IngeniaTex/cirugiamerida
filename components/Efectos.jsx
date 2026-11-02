'use client';
// Animaciones al hacer scroll: los elementos con .revelar aparecen cuando entran en pantalla.
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Efectos() {
  const ruta = usePathname();
  useEffect(() => {
    const els = document.querySelectorAll('.revelar:not(.visible)');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach(e => e.classList.add('visible')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }),
      { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    els.forEach(e => io.observe(e));
    const wa = document.querySelector('.wa-flotante');
    const f = () => wa && wa.classList.toggle('visible', scrollY > 400);
    f(); addEventListener('scroll', f, { passive: true });
    return () => { io.disconnect(); removeEventListener('scroll', f); };
  }, [ruta]);
  return null;
}
