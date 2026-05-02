/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests for the Timeline component.
 * Covers: rendering, step expansion, ARIA accordion patterns.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => <div ref={ref} {...props}>{children}</div>),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../components/T', () => ({
  default: ({ children }: { children: string }) => <>{children}</>,
}));

import Timeline from '../components/Timeline';

describe('Timeline Component', () => {
  it('renders the Election Lifecycle heading', () => {
    render(<Timeline />);
    expect(screen.getByText('Election Lifecycle')).toBeInTheDocument();
  });

  it('renders all 7 timeline steps', () => {
    render(<Timeline />);
    expect(screen.getByText('Voter Registration')).toBeInTheDocument();
    expect(screen.getByText('Candidate Filing')).toBeInTheDocument();
    expect(screen.getByText('Primaries / Nominations')).toBeInTheDocument();
    expect(screen.getByText('Campaign Period')).toBeInTheDocument();
    expect(screen.getByText('Election Day')).toBeInTheDocument();
    expect(screen.getByText('Vote Counting')).toBeInTheDocument();
    expect(screen.getByText('Results Certification')).toBeInTheDocument();
  });

  it('expands first step by default', () => {
    render(<Timeline />);
    expect(screen.getByText(/Eligible citizens must register/)).toBeInTheDocument();
  });

  it('collapses first step when clicked again', () => {
    render(<Timeline />);
    const firstStep = screen.getByText('Voter Registration').closest('button')!;
    fireEvent.click(firstStep);
    expect(screen.queryByText(/Eligible citizens must register/)).not.toBeInTheDocument();
  });

  it('expands a different step when clicked', () => {
    render(<Timeline />);
    const electionDay = screen.getByText('Election Day').closest('button')!;
    fireEvent.click(electionDay);
    expect(screen.getByText(/Voters go to designated polling stations/)).toBeInTheDocument();
  });

  it('only shows one expanded step at a time', () => {
    render(<Timeline />);
    const electionDay = screen.getByText('Election Day').closest('button')!;
    fireEvent.click(electionDay);
    // First step's long description should be gone
    expect(screen.queryByText(/Eligible citizens must register/)).not.toBeInTheDocument();
    // Election Day description should be visible
    expect(screen.getByText(/Voters go to designated polling stations/)).toBeInTheDocument();
  });

  it('has proper ARIA expanded state', () => {
    render(<Timeline />);
    const firstButton = screen.getByText('Voter Registration').closest('button')!;
    expect(firstButton).toHaveAttribute('aria-expanded', 'true');

    const secondButton = screen.getByText('Candidate Filing').closest('button')!;
    expect(secondButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('has listitem roles for timeline entries', () => {
    render(<Timeline />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(7);
  });
});
