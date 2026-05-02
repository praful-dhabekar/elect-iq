/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests for the useAnalytics hook.
 * Strategy: Mock window.gtag and verify it is called with correct event data.
 * This hook is fully testable by mocking window.gtag.
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAnalytics } from '../hooks/useAnalytics';

describe('useAnalytics', () => {
  let gtagMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtagMock = vi.fn();
    (window as any).gtag = gtagMock;
  });

  afterEach(() => {
    delete (window as any).gtag;
  });

  it('fires gtag event with correct name', () => {
    const { result } = renderHook(() => useAnalytics());
    act(() => result.current.trackEvent('chat_message_sent'));
    expect(gtagMock).toHaveBeenCalledWith('event', 'chat_message_sent', {});
  });

  it('fires gtag event with parameters', () => {
    const { result } = renderHook(() => useAnalytics());
    act(() => result.current.trackEvent('tab_switched', { tab_name: 'timeline' }));
    expect(gtagMock).toHaveBeenCalledWith('event', 'tab_switched', { tab_name: 'timeline' });
  });

  it('fires jargon_term_clicked with term parameter', () => {
    const { result } = renderHook(() => useAnalytics());
    act(() => result.current.trackEvent('jargon_term_clicked', { term: 'NOTA' }));
    expect(gtagMock).toHaveBeenCalledWith('event', 'jargon_term_clicked', { term: 'NOTA' });
  });

  it('fires language_changed with language parameter', () => {
    const { result } = renderHook(() => useAnalytics());
    act(() => result.current.trackEvent('language_changed', { language: 'hi' }));
    expect(gtagMock).toHaveBeenCalledWith('event', 'language_changed', { language: 'hi' });
  });

  it('does not throw when gtag is undefined', () => {
    delete (window as any).gtag;
    const { result } = renderHook(() => useAnalytics());
    expect(() => act(() => result.current.trackEvent('test_event'))).not.toThrow();
  });

  it('does not call gtag when it is undefined', () => {
    delete (window as any).gtag;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useAnalytics());
    act(() => result.current.trackEvent('test_event'));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
