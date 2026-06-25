import { describe, expect, it } from 'vitest';
import { getMaterialIconDisplay, getPlatformCardClass } from './materialIcon';

describe('getMaterialIconDisplay', () => {
  it('detecta PDF por nombreOriginal', () => {
    expect(getMaterialIconDisplay({
      tipo: 'archivo',
      categoria: 'archivo',
      nombreOriginal: 'apunte.pdf',
      url: '/uploads/materials/x.pdf',
    })).toEqual({ icon: '📕', cssClass: 'category-pdf' });
  });

  it('detecta imagen por extensión en la URL', () => {
    expect(getMaterialIconDisplay({
      tipo: 'archivo',
      categoria: 'archivo',
      url: 'https://storage.googleapis.com/bucket/materials/foto.png',
    })).toEqual({ icon: '🖼️', cssClass: 'category-image' });
  });

  it('usa icono web para links externos', () => {
    expect(getMaterialIconDisplay({
      tipo: 'link',
      categoria: 'web',
      url: 'https://example.com',
    })).toEqual({ icon: '🌐', cssClass: 'category-web' });
  });

  it('usa icono de marca para plataformas conocidas', () => {
    expect(getMaterialIconDisplay({
      tipo: 'link',
      categoria: 'youtube',
      url: 'https://youtube.com/watch?v=1',
    })).toEqual({ icon: null, brand: 'youtube', cssClass: 'category-youtube' });
  });

  it('usa icono de marca PowerPoint para archivos .pptx', () => {
    expect(getMaterialIconDisplay({
      tipo: 'archivo',
      categoria: 'archivo',
      nombreOriginal: 'presentacion.pptx',
    })).toEqual({ icon: null, brand: 'powerpoint', cssClass: 'category-powerpoint' });
  });

  it('usa icono de marca Word para archivos .docx', () => {
    expect(getMaterialIconDisplay({
      tipo: 'archivo',
      categoria: 'archivo',
      nombreOriginal: 'trabajo.docx',
    })).toEqual({ icon: null, brand: 'word', cssClass: 'category-word' });
  });

  it('usa icono de carpeta para archivos .zip', () => {
    expect(getMaterialIconDisplay({
      tipo: 'archivo',
      categoria: 'archivo',
      nombreOriginal: 'entrega.zip',
    })).toEqual({ icon: null, brand: 'zip', cssClass: 'category-zip' });
  });
});

describe('getPlatformCardClass', () => {
  it('devuelve clase de plataforma para materiales con marca', () => {
    expect(getPlatformCardClass({ icon: null, brand: 'github', cssClass: 'category-github' }))
      .toBe('is-platform is-github');
    expect(getPlatformCardClass({ icon: null, brand: 'powerpoint', cssClass: 'category-powerpoint' }))
      .toBe('is-platform is-powerpoint');
    expect(getPlatformCardClass({ icon: null, brand: 'word', cssClass: 'category-word' }))
      .toBe('is-platform is-word');
  });

  it('no devuelve clase de plataforma para materiales sin marca', () => {
    expect(getPlatformCardClass({ icon: '📄', cssClass: 'category-archivo' })).toBe('');
  });

  it('el zip usa icono de carpeta pero no recibe destacado de plataforma', () => {
    expect(getPlatformCardClass({ icon: null, brand: 'zip', cssClass: 'category-zip' })).toBe('');
  });
});
