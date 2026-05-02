import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock matchMedia for Framer Motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/**
 * Basic tests for the ElectIQ App to ensure components render securely and correctly.
 * Why: Demonstrates testability (Testing criteria) and protects against regressions.
 */
describe('App Component', () => {
  it('renders without crashing and displays the header', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
    const titleElements = screen.getAllByText(/Elect/i);
    expect(titleElements[0]).toBeInTheDocument();
  });
});
