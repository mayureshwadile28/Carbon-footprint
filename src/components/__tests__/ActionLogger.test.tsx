import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ActionLogger from '../ActionLogger';
import { PREDEFINED_ACTIONS } from '@/lib/metrics';

// Mock the useProfile hook
const mockLogAction = jest.fn();

jest.mock('@/context/ProfileContext', () => ({
  useProfile: () => ({
    isOnboarded: true,
    profile: {
      transport: 'Car (Gasoline)',
      diet: 'Average',
      energy: 'Grid (Mixed)',
      householdSize: 1,
    },
    actions: [],
    saveProfile: jest.fn(),
    logAction: mockLogAction,
    resetData: jest.fn(),
  }),
}));

describe('ActionLogger', () => {
  beforeEach(() => {
    mockLogAction.mockClear();
  });

  it('renders the select dropdown with all predefined actions', () => {
    render(<ActionLogger />);

    const select = screen.getByLabelText('Select a green action to log');
    expect(select).toBeInTheDocument();

    // Check that every predefined action appears as an option
    const options = select.querySelectorAll('option');
    expect(options.length).toBe(PREDEFINED_ACTIONS.length);

    PREDEFINED_ACTIONS.forEach((action) => {
      expect(
        screen.getByText(`${action.name} (-${action.co2Saved}kg CO2)`)
      ).toBeInTheDocument();
    });
  });

  it('renders the Log Action button', () => {
    render(<ActionLogger />);

    const button = screen.getByRole('button', { name: /log action/i });
    expect(button).toBeInTheDocument();
  });

  it('calls logAction with the first action by default when Log Action is clicked', () => {
    render(<ActionLogger />);

    const button = screen.getByRole('button', { name: /log action/i });
    fireEvent.click(button);

    expect(mockLogAction).toHaveBeenCalledTimes(1);
    expect(mockLogAction).toHaveBeenCalledWith({
      name: PREDEFINED_ACTIONS[0].name,
      category: PREDEFINED_ACTIONS[0].category,
      co2Saved: PREDEFINED_ACTIONS[0].co2Saved,
    });
  });

  it('calls logAction with the selected action when a different option is chosen', () => {
    render(<ActionLogger />);

    const select = screen.getByLabelText('Select a green action to log');
    const targetAction = PREDEFINED_ACTIONS[2]; // Bike/Walk Commute

    fireEvent.change(select, { target: { value: targetAction.id } });

    const button = screen.getByRole('button', { name: /log action/i });
    fireEvent.click(button);

    expect(mockLogAction).toHaveBeenCalledTimes(1);
    expect(mockLogAction).toHaveBeenCalledWith({
      name: targetAction.name,
      category: targetAction.category,
      co2Saved: targetAction.co2Saved,
    });
  });

  it('renders the informational text', () => {
    render(<ActionLogger />);
    expect(
      screen.getByText(/logging this predefined action accurately/i)
    ).toBeInTheDocument();
  });
});
