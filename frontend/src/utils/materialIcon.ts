export type MaterialIconInput = {
  tipo: 'archivo' | 'link';
  categoria: string;
  url?: string | null;
  nombreOriginal?: string | null;
};

export type MaterialIconDisplay = {
  icon: string | null;
  brand?: 'youtube' | 'drive' | 'github' | 'discord' | 'powerpoint' | 'word' | 'zip';
  cssClass: string;
};

function extractExtension(source: string): string {
  const clean = source.split('?')[0].split('#')[0];
  const dot = clean.lastIndexOf('.');
  if (dot === -1) return '';
  return clean.slice(dot).toLowerCase();
}

function iconFromExtension(ext: string): MaterialIconDisplay | null {
  switch (ext) {
    case '.jpg':
    case '.jpeg':
    case '.png':
      return { icon: '🖼️', cssClass: 'category-image' };
    case '.pdf':
      return { icon: '📕', cssClass: 'category-pdf' };
    case '.doc':
    case '.docx':
      return { icon: null, brand: 'word', cssClass: 'category-word' };
    case '.ppt':
    case '.pptx':
      return { icon: null, brand: 'powerpoint', cssClass: 'category-powerpoint' };
    case '.xls':
    case '.xlsx':
      return { icon: '📊', cssClass: 'category-excel' };
    case '.zip':
      return { icon: null, brand: 'zip', cssClass: 'category-zip' };
    default:
      return null;
  }
}

// Marcas que ademas del icono reciben la linea/borde de color destacado en la card
// (plataformas y archivos Office). El zip usa icono de carpeta pero sin destacado.
const PLATFORM_BRANDS = new Set(['youtube', 'drive', 'github', 'discord', 'powerpoint', 'word']);

export function getPlatformCardClass(display: MaterialIconDisplay): string {
  if (display.brand && PLATFORM_BRANDS.has(display.brand)) {
    return `is-platform is-${display.brand}`;
  }
  return '';
}

function iconFromCategoria(categoria: string): MaterialIconDisplay {
  switch (categoria) {
    case 'youtube':
      return { icon: null, brand: 'youtube', cssClass: 'category-youtube' };
    case 'drive':
      return { icon: null, brand: 'drive', cssClass: 'category-drive' };
    case 'github':
      return { icon: null, brand: 'github', cssClass: 'category-github' };
    case 'discord':
      return { icon: null, brand: 'discord', cssClass: 'category-discord' };
    case 'web':
      return { icon: '🌐', cssClass: 'category-web' };
    case 'otro':
      return { icon: '🔗', cssClass: 'category-otro' };
    default:
      return { icon: '📄', cssClass: 'category-archivo' };
  }
}

export function getMaterialIconDisplay(material: MaterialIconInput): MaterialIconDisplay {
  if (material.tipo === 'archivo' || material.categoria === 'archivo') {
    const ext = extractExtension(material.nombreOriginal || material.url || '');
    const byExt = iconFromExtension(ext);
    if (byExt) return byExt;
    return { icon: '📄', cssClass: 'category-archivo' };
  }

  return iconFromCategoria(material.categoria);
}
