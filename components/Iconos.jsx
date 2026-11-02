// Íconos de línea del sitio.
const P = {
  cal: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  flecha: <path d="M9 6l6 6-6 6" />,
  chev: <path d="m7 10 5 5 5-5" />,
  mas: <path d="M12 5v14M5 12h14" />,
  tel: <path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 12l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" />,
  pin: <><path d="M12 21s7-6.4 7-11.5A7 7 0 0 0 5 9.5C5 14.6 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
};
export function Icono({ n }) {
  if (n === 'wa') return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ico"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.3-.5.1-1 .1-1.7-.1a15 15 0 0 1-1.5-.6 12 12 0 0 1-4.6-4.1 5.4 5.4 0 0 1-1.1-2.8 3 3 0 0 1 1-2.3 1 1 0 0 1 .7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6a9 9 0 0 0 1.6 2 8 8 0 0 0 2.4 1.5c.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.8.9c.3.1.5.2.5.3.1.2.1.7-.1 1.4z" /></svg>
  );
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="ico" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{P[n]}</svg>;
}
