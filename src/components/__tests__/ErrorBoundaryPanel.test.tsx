import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundaryPanel from '../ErrorBoundaryPanel';

// Suppress console.error in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundaryPanel', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundaryPanel>
        <div data-testid="child">Child Content</div>
      </ErrorBoundaryPanel>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders fallback UI when a child throws an error', () => {
    const ThrowError = () => {
      throw new Error('Test Error');
    };

    render(
      <ErrorBoundaryPanel fallbackMessage="Custom error message">
        <ThrowError />
      </ErrorBoundaryPanel>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders default fallback message if none provided', () => {
    const ThrowError = () => {
      throw new Error('Test Error');
    };

    render(
      <ErrorBoundaryPanel>
        <ThrowError />
      </ErrorBoundaryPanel>
    );

    expect(screen.getByText('This panel encountered an error. Please try refreshing.')).toBeInTheDocument();
  });
});
