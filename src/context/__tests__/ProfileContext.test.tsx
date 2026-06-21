import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ProfileProvider, useProfile, ProfileData } from '../ProfileContext';

// Mock localStorage
let localStorageStore: Record<string, string> = {};

beforeEach(() => {
  localStorageStore = {};
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(
    (key: string) => localStorageStore[key] ?? null
  );
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(
    (key: string, value: string) => {
      localStorageStore[key] = value;
    }
  );
  jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(
    (key: string) => {
      delete localStorageStore[key];
    }
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});


// Test helper with action buttons
function TestConsumerWithActions() {
  const { isOnboarded, profile, actions, saveProfile, logAction, resetData } = useProfile();

  return (
    <div>
      <span data-testid="onboarded">{String(isOnboarded)}</span>
      <span data-testid="profile">{JSON.stringify(profile)}</span>
      <span data-testid="actions">{JSON.stringify(actions)}</span>
      <button
        data-testid="save-profile"
        onClick={() =>
          saveProfile({
            transport: 'Car (Electric)',
            diet: 'Vegan',
            energy: '100% Renewable',
            householdSize: 2,
          })
        }
      >
        Save
      </button>
      <button
        data-testid="log-action"
        onClick={() =>
          logAction({
            name: 'Bike Commute',
            category: 'Transport',
            co2Saved: 3.5,
          })
        }
      >
        Log
      </button>
      <button data-testid="reset" onClick={resetData}>
        Reset
      </button>
    </div>
  );
}

describe('ProfileContext', () => {
  it('throws an error when useProfile is used outside ProfileProvider', () => {
    // Suppress console.error for the expected error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    function BadComponent() {
      useProfile();
      return <div />;
    }

    expect(() => render(<BadComponent />)).toThrow(
      'useProfile must be used within a ProfileProvider'
    );

    spy.mockRestore();
  });

  it('provides default values when no localStorage data exists', () => {
    render(
      <ProfileProvider>
        <TestConsumerWithActions />
      </ProfileProvider>
    );

    expect(screen.getByTestId('onboarded').textContent).toBe('false');
    expect(screen.getByTestId('profile').textContent).toBe('null');
    expect(screen.getByTestId('actions').textContent).toBe('[]');
  });

  it('saveProfile stores profile to state and localStorage', () => {
    render(
      <ProfileProvider>
        <TestConsumerWithActions />
      </ProfileProvider>
    );

    act(() => {
      screen.getByTestId('save-profile').click();
    });

    // State should be updated
    expect(screen.getByTestId('onboarded').textContent).toBe('true');
    const profileData = JSON.parse(screen.getByTestId('profile').textContent!);
    expect(profileData.transport).toBe('Car (Electric)');
    expect(profileData.diet).toBe('Vegan');
    expect(profileData.energy).toBe('100% Renewable');
    expect(profileData.householdSize).toBe(2);

    // localStorage should have been called
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'carbon_profile',
      expect.any(String)
    );
  });

  it('logAction adds an action with id and date', () => {
    render(
      <ProfileProvider>
        <TestConsumerWithActions />
      </ProfileProvider>
    );

    act(() => {
      screen.getByTestId('log-action').click();
    });

    const actions = JSON.parse(screen.getByTestId('actions').textContent!);
    expect(actions.length).toBe(1);
    expect(actions[0].name).toBe('Bike Commute');
    expect(actions[0].category).toBe('Transport');
    expect(actions[0].co2Saved).toBe(3.5);
    // id and date should be auto-generated
    expect(actions[0].id).toBeTruthy();
    expect(typeof actions[0].id).toBe('string');
    expect(actions[0].date).toBeTruthy();
    expect(typeof actions[0].date).toBe('string');

    // localStorage should have been called
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'carbon_actions',
      expect.any(String)
    );
  });

  it('logAction adds multiple actions', () => {
    render(
      <ProfileProvider>
        <TestConsumerWithActions />
      </ProfileProvider>
    );

    act(() => {
      screen.getByTestId('log-action').click();
    });
    act(() => {
      screen.getByTestId('log-action').click();
    });

    const actions = JSON.parse(screen.getByTestId('actions').textContent!);
    expect(actions.length).toBe(2);
  });

  it('resetData clears profile, actions, and isOnboarded', () => {
    render(
      <ProfileProvider>
        <TestConsumerWithActions />
      </ProfileProvider>
    );

    // First, save some data
    act(() => {
      screen.getByTestId('save-profile').click();
    });
    act(() => {
      screen.getByTestId('log-action').click();
    });

    // Verify data was saved
    expect(screen.getByTestId('onboarded').textContent).toBe('true');
    expect(JSON.parse(screen.getByTestId('profile').textContent!)).not.toBeNull();
    expect(JSON.parse(screen.getByTestId('actions').textContent!).length).toBe(1);

    // Now reset
    act(() => {
      screen.getByTestId('reset').click();
    });

    // Everything should be cleared
    expect(screen.getByTestId('onboarded').textContent).toBe('false');
    expect(screen.getByTestId('profile').textContent).toBe('null');
    expect(screen.getByTestId('actions').textContent).toBe('[]');

    // localStorage should have been cleared
    expect(localStorage.removeItem).toHaveBeenCalledWith('carbon_profile');
    expect(localStorage.removeItem).toHaveBeenCalledWith('carbon_actions');
  });

  it('loads data from localStorage on mount', () => {
    const existingProfile: ProfileData = {
      transport: 'Public Transit',
      diet: 'Vegetarian',
      energy: 'Grid (Mixed)',
      householdSize: 3,
    };

    localStorageStore['carbon_profile'] = JSON.stringify(existingProfile);
    localStorageStore['carbon_actions'] = JSON.stringify([
      {
        id: 'test-1',
        name: 'Meatless Day',
        category: 'Diet',
        co2Saved: 5.2,
        date: '2026-06-01',
      },
    ]);

    render(
      <ProfileProvider>
        <TestConsumerWithActions />
      </ProfileProvider>
    );

    // After useEffect runs, data should be loaded
    expect(screen.getByTestId('onboarded').textContent).toBe('true');

    const profileData = JSON.parse(screen.getByTestId('profile').textContent!);
    expect(profileData.transport).toBe('Public Transit');

    const actions = JSON.parse(screen.getByTestId('actions').textContent!);
    expect(actions.length).toBe(1);
    expect(actions[0].name).toBe('Meatless Day');
  });
});
