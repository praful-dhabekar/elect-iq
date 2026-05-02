/**
 * Tests for the Checklist component.
 * Covers: rendering, checkbox toggling, localStorage persistence, progress calculation.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => <div ref={ref} {...props}>{children}</div>),
    button: React.forwardRef(({ children, ...props }: any, ref: any) => <button ref={ref} {...props}>{children}</button>),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock T component to pass-through text
vi.mock('../components/T', () => ({
  default: ({ children }: { children: string }) => <>{children}</>,
}));

// Mock Firebase dependencies
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));
vi.mock('../firebase', () => ({
  db: {},
}));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

import VoterChecklist from '../components/Checklist';

describe('VoterChecklist Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the heading', () => {
    render(<VoterChecklist />);
    expect(screen.getByText('Your Voter Readiness')).toBeInTheDocument();
  });

  it('renders all 6 checklist items', () => {
    render(<VoterChecklist />);
    expect(screen.getByText('Am I registered?')).toBeInTheDocument();
    expect(screen.getByText('Do I know my polling station?')).toBeInTheDocument();
    expect(screen.getByText('Have I checked my voter ID?')).toBeInTheDocument();
    expect(screen.getByText('Do I know the election date?')).toBeInTheDocument();
    expect(screen.getByText('Have I reviewed candidates?')).toBeInTheDocument();
    expect(screen.getByText('Do I know my rights?')).toBeInTheDocument();
  });

  it('shows 0% progress initially', () => {
    render(<VoterChecklist />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('toggles a checklist item on click', () => {
    render(<VoterChecklist />);
    const firstItem = screen.getByText('Am I registered?');
    fireEvent.click(firstItem.closest('button')!);
    expect(screen.getByText('17%')).toBeInTheDocument(); // 1/6 ≈ 17%
  });

  it('persists checked items to localStorage', () => {
    render(<VoterChecklist />);
    const firstItem = screen.getByText('Am I registered?');
    fireEvent.click(firstItem.closest('button')!);
    const stored = JSON.parse(localStorage.getItem('electiq-checklist')!);
    expect(stored[0]).toBe(true);
    expect(stored[1]).toBe(false);
  });

  it('restores state from localStorage', () => {
    localStorage.setItem('electiq-checklist', JSON.stringify([true, true, false, false, false, false]));
    render(<VoterChecklist />);
    expect(screen.getByText('33%')).toBeInTheDocument(); // 2/6 ≈ 33%
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('electiq-checklist', 'not-json');
    expect(() => render(<VoterChecklist />)).not.toThrow();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('shows celebration message at 100%', () => {
    localStorage.setItem('electiq-checklist', JSON.stringify([true, true, true, true, true, true]));
    render(<VoterChecklist />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText(/You're all set! Your civic duty awaits/i)).toBeInTheDocument();
  });

  it('has proper ARIA roles for checkboxes', () => {
    render(<VoterChecklist />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(6);
  });

  it('has progressbar with correct ARIA attributes', () => {
    render(<VoterChecklist />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  });
});
