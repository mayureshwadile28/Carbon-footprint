import React from 'react';
import { render, screen } from '@testing-library/react';
import HomeClient from '../HomeClient';

// Mock child components
jest.mock('@/components/Onboarding', () => {
  return function MockOnboarding() { return <div data-testid="onboarding">Onboarding</div>; };
});

jest.mock('@/components/Dashboard', () => {
  return function MockDashboard() { return <div data-testid="dashboard">Dashboard</div>; };
});

// Mock the context hook
const mockUseProfile = jest.fn();
jest.mock('@/context/ProfileContext', () => ({
  useProfile: () => mockUseProfile(),
}));

describe('HomeClient', () => {
  it('shows loading state when isLoaded is false', () => {
    mockUseProfile.mockReturnValue({ isOnboarded: false, isLoaded: false });
    render(<HomeClient />);
    // Check for the main element which has aria-busy when not loaded
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByTestId('onboarding')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });

  it('shows Onboarding when isLoaded is true but not onboarded', () => {
    mockUseProfile.mockReturnValue({ isOnboarded: false, isLoaded: true });
    render(<HomeClient />);
    expect(screen.getByTestId('onboarding')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });

  it('shows Dashboard when isLoaded is true and onboarded', () => {
    mockUseProfile.mockReturnValue({ isOnboarded: true, isLoaded: true });
    render(<HomeClient />);
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('onboarding')).not.toBeInTheDocument();
  });
});
