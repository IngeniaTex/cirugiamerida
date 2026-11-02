import path from 'path';
import { fileURLToPath } from 'url';

/** Sitio estático: `npm run build` genera la carpeta out/ lista para cualquier hosting. */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: { root: path.dirname(fileURLToPath(import.meta.url)) },
};
export default nextConfig;
