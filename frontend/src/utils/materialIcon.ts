export type MaterialIconInput = {
  tipo: 'archivo' | 'link';
  categoria: string;
  url?: string | null;
  nombreOriginal?: string | null;
};

export type MaterialIconDisplay = {
  icon: string | null;
  brand?: 'youtube' | 'drive' | 'github' | 'discord';
  cssClass: string;
};

function extractExtension(source: string): string {  const clean = source.split('?')[0].split('#')[0];
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
      return { icon: '📝', cssClass: 'category-word' };
    case '.ppt':
    case '.pptx':
      return { icon: '📽️', cssClass: 'category-powerpoint' };
    case '.xls':
    case '.xlsx':
      return { icon: '📊', cssClass: 'category-excel' };
    case '.zip':
      return { icon: '🗜️', cssClass: 'category-zip' };
    default:
      return null;
  }
}

const PLATFORM_CATEGORIES = new Set(['youtube', 'drive', 'github', 'discord']);

export function getPlatformCardClass(categoria: string): string {
  if (PLATFORM_CATEGORIES.has(categoria)) {
    return `is-platform is-${categoria}`;
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