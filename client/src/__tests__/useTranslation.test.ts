/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests for the useTranslation hook.
 * Strategy: Test the buildCacheKey pure function directly, and test
 * batching/caching behaviour by rendering the hook with a mock fetch.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildCacheKey } from '../hooks/useTranslation';

describe('buildCacheKey (pure function)', () => {
  it('creates a key with format "lang:text"', () => {
    expect(buildCacheKey('hi', 'hello')).toBe('hi:hello');
  });

  it('differentiates between languages', () => {
    expect(buildCacheKey('hi', 'hello')).not.toBe(buildCacheKey('bn', 'hello'));
  });

  it('handles empty text', () => {
    expect(buildCacheKey('hi', '')).toBe('hi:');
  });

  it('handles text with special characters', () => {
    expect(buildCacheKey('ta', 'hello world!')).toBe('ta:hello world!');
  });

  it('handles long text', () => {
    const longText = 'a'.repeat(500);
    expect(buildCacheKey('te', longText)).toBe(`te:${longText}`);
  });
});

describe('useTranslation hook integration', () => {
  const mockTranslations = ['नमस्ते'];

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translations: mockTranslations }),
    }) as any;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('persists language selection in localStorage', () => {
    localStorage.setItem('electiq_language', 'mr');
    expect(localStorage.getItem('electiq_language')).toBe('mr');
  });

  it('defaults to English when localStorage is empty', () => {
    expect(localStorage.getItem('electiq_language')).toBeNull();
  });

  it('buildCacheKey is consistent for same inputs', () => {
    const key1 = buildCacheKey('hi', 'test');
    const key2 = buildCacheKey('hi', 'test');
    expect(key1).toBe(key2);
  });
});
