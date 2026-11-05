// Acceso a los datos de las páginas (data/paginas/*.json, generados con tools/importar_wix.py)
// y a la configuración del sitio (menú, contacto y metadatos).
import fs from 'fs';
import path from 'path';
import sitio from '@/data/sitio.json';
import conf from '@/data/paginas.json';

export { sitio };
export const WA = `https://wa.me/${sitio.contacto.whatsapp}`;
export const TEL = sitio.contacto.telefonos[0].tel;
export const servicios = conf.servicios;
export const dietas = conf.dietas;

const DIR = path.join(process.cwd(), 'data', 'paginas');

export function slugs() {
  return fs.readdirSync(DIR).map(f => f.replace(/\.json$/, '')).filter(s => s !== 'inicio');
}

export function pagina(slug) {
  return JSON.parse(fs.readFileSync(path.join(DIR, `${slug}.json`), 'utf8'));
}

const PROPIAS = {
  inicio: { titulo: 'Dr. Joel Dorantes | Cirujano General Certificado en Mérida',
    descripcion: 'Cirujano General Certificado en Mérida. Alta Especialidad en Cirugía Laparoscópica Avanzada. Atención médica y quirúrgica para enfermedades del abdomen, digestivas y de la piel.' },
  servicios: { titulo: 'Servicios | Dr. Joel Dorantes',
    descripcion: '¿Cuál es tu motivo de consulta? ¿Qué síntomas tienes? Vesícula biliar, hernias, enfermedades del estómago y del colon, apendicitis aguda, quistes, lipomas y cirugía laparoscópica en Mérida.' },
  'dietas-especiales': { titulo: 'Dietas especiales | Dr. Joel Dorantes',
    descripcion: 'Guías de alimentación especiales, con recomendaciones sobre qué alimentos puedes consumir, cuáles debes evitar y cómo adaptar tu dieta según tus necesidades.' },
  'cuidados-postoperatorios': { titulo: 'Cuidados Postoperatorios: Guía Después de una Cirugía',
    descripcion: 'Conoce los cuidados después de una cirugía: heridas, drenajes, medicamentos, alimentación, actividad física y señales de alarma durante tu recuperación.' },
  'sobre-mi': { titulo: 'Dr. Joel Dorantes | Cirujano General en Mérida',
    descripcion: 'Conoce al Dr. Joel Dorantes, cirujano general certificado en Mérida. Formación en cirugía laparoscópica avanzada, experiencia y trayectoria profesional.' },
  pacientes: { titulo: 'Ingreso a cirugía | Preparándome para mi cirugía | Dr. Joel Dorantes',
    descripcion: 'Recomendaciones para su internamiento en Mérida: llegar con dos horas de anticipación, ayuno de 8 horas, qué debe traer consigo y preadmisión en el hospital para que su cirugía comience a tiempo.' },
};

export function meta(slug) {
  const p = PROPIAS[slug] || [...servicios, ...dietas].find(x => x.slug === slug);
  return { titulo: p.titulo, descripcion: p.descripcion };
}

// Datos estructurados: médico (todas las páginas) y preguntas frecuentes (si la página las tiene)
export function esquemas(datos) {
  const C = sitio.contacto;
  const medico = {
    '@context': 'https://schema.org', '@type': 'Physician', name: sitio.nombreCompleto, url: sitio.dominio + '/',
    medicalSpecialty: 'Surgical', email: C.correo, telephone: C.telefonos.map(t => t.tel),
    description: 'Cirujano General Certificado en Mérida. Alta Especialidad en Cirugía Laparoscópica Avanzada.',
    address: { '@type': 'PostalAddress', streetAddress: 'Calle 18 (Esquina con 5) No. 57, Colonia San Antonio Cinta', addressLocality: 'Mérida', addressRegion: 'Yucatán', addressCountry: 'MX' },
  };
  const preguntas = datos.secciones.flatMap(s => s.items.filter(i => i.k === 'faq').flatMap(i => i.preguntas));
  const lista = [medico];
  if (preguntas.length) lista.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: preguntas.map(q => ({
    '@type': 'Question', name: q.p, acceptedAnswer: { '@type': 'Answer', text: q.r.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() } })) });
  return lista;
}
