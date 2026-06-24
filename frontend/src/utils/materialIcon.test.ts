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
});

describe('getPlatformCardClass', () => {
  it('devuelve clase de plataforma para links conocidos', () => {
    expect(getPlatformCardClass('github')).toBe('is-platform is-github');
    expect(getPlatformCardClass('archivo')).toBe('');
  });
});
