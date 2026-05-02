import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTranslation } from '../useTranslation';

describe('useTranslation extra test cases', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translations: ['नमस्ते'] }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('Test that switching back to \'en\' returns original text immediately', () => {
    const { result } = renderHook(() => useTranslation());

    act(() => {
      result.current.setLanguage('hi');
    });

    expect(result.current.language).toBe('hi');

    act(() => {
      result.current.setLanguage('en');
    });

    expect(result.current.language).toBe('en');
    expect(result.current.t('hello')).toBe('hello');
  });

  it('Test that two different strings are cached independently', async () => {
    const { result } = renderHook(() => useTranslation());

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translations: ['एक', 'दो'] }),
    });

    act(() => {
      result.current.setLanguage('hi');
    });

    act(() => {
      result.current.t('one');
      result.current.t('two');
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/translate', expect.objectContaining({
      body: expect.stringContaining('one')
    }));
    expect(global.fetch).toHaveBeenCalledWith('/api/translate', expect.objectContaining({
      body: expect.stringContaining('two')
    }));
  });
});
