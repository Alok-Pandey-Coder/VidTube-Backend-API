import { describe, it, expect } from 'vitest';
import { encodeCursor, decodeCursor } from '../src/controllers/video.controller.js';
import { getFilePath } from '../services/storage.js';

describe('cursor helpers', () => {
  it('round-trips value and id', () => {
    const c = encodeCursor('2026-01-01T00:00:00.000Z', 'abc');
    expect(typeof c).toBe('string');
    expect(decodeCursor(c)).toEqual({ v: '2026-01-01T00:00:00.000Z', id: 'abc' });
  });

  it('returns null for garbage', () => {
    expect(decodeCursor('%%%not-a-cursor')).toBeNull();
  });
});

describe('storage adapter', () => {
  it('blocks path traversal', () => {
    expect(() => getFilePath('../../.env')).toThrow('Invalid storage key');
  });

  it('resolves a normal key inside storage', () => {
    expect(getFilePath('videos/abc/original.mp4')).toMatch(/storage/);
  });
});