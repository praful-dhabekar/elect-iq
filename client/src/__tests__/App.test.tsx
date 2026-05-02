/**
 * Tests for the App component.
 * Covers: rendering, tab switching, language selector, ARIA navigation.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock matchMedia for Framer Motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })),
});

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => <div ref={ref} {...props}>{children}</div>),
    section: React.forwardRef(({ children, ...props }: any, ref: any) => <section ref={ref} {...props}>{children}</section>),
    button: React.forwardRef(({ children, ...props }: any, ref: any) => <button ref={ref} {...props}>{children}</button>),
    ul: React.forwardRef(({ children, ...props }: any, ref: any) => <ul ref={ref} {...props}>{children}</ul>),
    li: React.forwardRef(({ children, ...props }: any, ref: any) => <li ref={ref} {...props}>{children}</li>),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock heavy child components to isolate App testing
vi.mock('../components/Chat', () => ({ default: () => <div data-testid="chat">Chat</div> }));
vi.mock('../components/Timeline', () => ({ default: () => <div data-testid="timeline">Timeline</div> }));
vi.mock('../components/Checklist', () => ({ default: () => <div data-testid="checklist">Checklist</div> }));
vi.mock('../components/JargonBuster', () => ({ default: () => <div data-testid="jargon">JargonBuster</div> }));
vi.mock('../components/T', () => ({ default: ({ children }: { children: string }) => <>{children}</> }));
vi.mock('../context/TranslationContext', () => ({
  useT: () => ({ t: (s: string) => s, language: 'en', setLanguage: vi.fn(), isTranslating: false }),
}));
vi.mock('../hooks/useAnalytics', () => ({
  useAnalytics: () => ({ trackEvent: vi.fn() }),
}));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false, signInWithGoogle: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

import App from '../App';

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the ElectIQ header', () => {
    render(<App />);
    expect(screen.getByText('IQ')).toBeInTheDocument();
  });

  it('renders the chat tab by default', () => {
    render(<App />);
    expect(screen.getByTestId('chat')).toBeInTheDocument();
  });

  it('switches to Timeline tab when clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Switch to Timeline'));
    expect(screen.getByTestId('timeline')).toBeInTheDocument();
  });

  it('switches to Voter Checklist tab', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Switch to Voter Checklist'));
    expect(screen.getByTestId('checklist')).toBeInTheDocument();
  });

  it('switches to Jargon Buster tab', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Switch to Jargon Buster'));
    expect(screen.getByTestId('jargon')).toBeInTheDocument();
  });

  it('has desktop navigation with proper ARIA labels', () => {
    render(<App />);
    expect(screen.getByLabelText('Desktop Navigation')).toBeInTheDocument();
  });

  it('has mobile navigation with proper ARIA labels', () => {
    render(<App />);
    expect(screen.getByLabelText('Mobile Navigation')).toBeInTheDocument();
  });

  it('marks active tab with aria-current="page"', () => {
    render(<App />);
    const chatButton = screen.getByLabelText('Switch to Election Chat');
    expect(chatButton).toHaveAttribute('aria-current', 'page');
  });

  it('renders the language selector button', () => {
    render(<App />);
    expect(screen.getByLabelText('Select language')).toBeInTheDocument();
  });

  it('renders the footer on desktop', () => {
    render(<App />);
    expect(screen.getByText(/Factual information for an informed democracy/)).toBeInTheDocument();
  });
});
