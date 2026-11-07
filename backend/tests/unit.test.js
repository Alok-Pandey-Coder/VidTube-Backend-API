import { describe, it, expect } from 'vitest';
import { encodeCursor, decodeCursor } from '../src/controllers/video.controller.js';
import { getFilePath } from '../services/storage.js';
import { sanitizeInsights } from '../services/llm.js';

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

describe('sanitizeInsights', () => {
  it('cleans chapters and tags from untrusted LLM output', () => {
    const out = sanitizeInsights(
      {
        summary: 'x',
        chapters: [
          { start: 50, title: 'B' },
          { start: 5, title: 'A' },
          { start: 8, title: 'too close' },
          { start: 200, title: 'C' },
          { start: 9999, title: 'beyond video' },
        ],
        tags: ['A', 'a', 'b'],
      },
      300,
    );
    expect(out.chapters.map((c) => c.start)).toEqual([0, 50, 200]);
    expect(out.tags).toEqual(['a', 'b']);
  });

  it('drops chapters when fewer than 3', () => {
    const out = sanitizeInsights({ chapters: [{ start: 0, title: 'only' }] }, 300);
    expect(out.chapters).toEqual([]);
  });
});
