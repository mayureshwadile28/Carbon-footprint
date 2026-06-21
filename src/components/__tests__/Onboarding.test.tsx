import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Onboarding from '../Onboarding';

// Mock the useProfile hook
const mockSaveProfile = jest.fn();

jest.mock('@/context/ProfileContext', () => ({
  useProfile: () => ({
    isOnboarded: false,
    profile: null,
    actions: [],
    saveProfile: mockSaveProfile,
    logAction: jest.fn(),
    resetData: jest.fn(),
  }),
}));

describe('Onboarding', () => {
  beforeEach(() => {
    mockSaveProfile.mockClear();
  });

  it('renders Step 1 with transport options', () => {
    render(<Onboarding />);

    expect(screen.getByText('How do you usually commute?')).toBeInTheDocument();
    expect(screen.getByText('Car (Gasoline)')).toBeInTheDocument();
    expect(screen.getByText('Car (Electric)')).toBeInTheDocument();
    expect(screen.getByText('Public Transit')).toBeInTheDocument();
    expect(screen.getByText('Bicycle / Walking')).toBeInTheDocument();
  });

  it('advances to Step 2 when a transport option is clicked', () => {
    render(<Onboarding />);

    fireEvent.click(screen.getByText('Car (Gasoline)'));

    // Step 2 should now be visible with diet options
    expect(screen.getByText('What best describes your diet?')).toBeInTheDocument();
    expect(screen.getByText('Meat Heavy')).toBeInTheDocument();
    expect(screen.getByText('Average')).toBeInTheDocument();
    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
    expect(screen.getByText('Vegan')).toBeInTheDocument();
  });

  it('goes back to Step 1 when Back button is clicked on Step 2', () => {
    render(<Onboarding />);

    // Go to step 2
    fireEvent.click(screen.getByText('Car (Electric)'));
    expect(screen.getByText('What best describes your diet?')).toBeInTheDocument();

    // Click Back
    fireEvent.click(screen.getByText('Back'));

    // Should be back at step 1
    expect(screen.getByText('How do you usually commute?')).toBeInTheDocument();
  });

  it('advances through all steps to Step 4', () => {
    render(<Onboarding />);

    // Step 1 → Step 2
    fireEvent.click(screen.getByText('Car (Gasoline)'));
    expect(screen.getByText('What best describes your diet?')).toBeInTheDocument();

    // Step 2 → Step 3
    fireEvent.click(screen.getByText('Vegetarian'));
    expect(screen.getByText("What's your primary home energy source?")).toBeInTheDocument();

    // Step 3 → Step 4
    fireEvent.click(screen.getByText('100% Renewable'));
    expect(screen.getByText('How many people live in your household?')).toBeInTheDocument();
  });

  it('shows Complete Profile button on Step 4', () => {
    render(<Onboarding />);

    // Navigate to step 4
    fireEvent.click(screen.getByText('Public Transit'));
    fireEvent.click(screen.getByText('Vegan'));
    fireEvent.click(screen.getByText('Solar (Off-grid)'));

    expect(screen.getByText('Complete Profile')).toBeInTheDocument();
  });

  it('calls saveProfile when Complete Profile is clicked', () => {
    render(<Onboarding />);

    // Navigate to step 4
    fireEvent.click(screen.getByText('Car (Gasoline)'));
    fireEvent.click(screen.getByText('Average'));
    fireEvent.click(screen.getByText('Grid (Mixed)'));

    // Click Complete Profile
    fireEvent.click(screen.getByText('Complete Profile'));

    expect(mockSaveProfile).toHaveBeenCalledTimes(1);
    expect(mockSaveProfile).toHaveBeenCalledWith({
      transport: 'Car (Gasoline)',
      diet: 'Average',
      energy: 'Grid (Mixed)',
      householdSize: 1,
    });
  });

  it('Back button on Step 3 returns to Step 2', () => {
    render(<Onboarding />);

    // Navigate to step 3
    fireEvent.click(screen.getByText('Car (Electric)'));
    fireEvent.click(screen.getByText('Meat Heavy'));
    expect(screen.getByText("What's your primary home energy source?")).toBeInTheDocument();

    // Click Back
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('What best describes your diet?')).toBeInTheDocument();
  });

  it('Back button on Step 4 returns to Step 3', () => {
    render(<Onboarding />);

    // Navigate to step 4
    fireEvent.click(screen.getByText('Car (Gasoline)'));
    fireEvent.click(screen.getByText('Vegetarian'));
    fireEvent.click(screen.getByText('Natural Gas'));
    expect(screen.getByText('How many people live in your household?')).toBeInTheDocument();

    // Click Back
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText("What's your primary home energy source?")).toBeInTheDocument();
  });
});
