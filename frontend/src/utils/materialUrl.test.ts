import { describe, expect, it } from 'vitest';
import { resolveMaterialUrl } from './materialUrl';

describe('resolveMaterialUrl', () => {
  it('keeps Google Cloud Storage URLs unchanged', () => {
    const url = 'https://storage.googleapis.com/demo/materials/apunte.pdf';

    expect(resolveMaterialUrl(url, 'archivo', 'http://localhost:5000/api')).toBe(url);
  });

  it('builds an absolute URL for locally stored files', () => {
    expect(
      resolveMaterialUrl('/uploads/materials/apunte.pdf', 'archivo', 'http://localhost:5000/api'),
    ).toBe('http://localhost:5000/uploads/materials/apunte.pdf');
  });

  it('does not modify external resources', () => {
    const url = 'https://example.com/recurso';

    expect(resolveMaterialUrl(url, 'link', 'http://localhost:5000/api')).toBe(url);
  });

  it('returns null when the material has no URL', () => {
    expect(resolveMaterialUrl('  ', 'archivo')).toBeNull();
  });
});
