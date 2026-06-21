import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SmartAssistant from '../SmartAssistant';

const mockLogAction = jest.fn();
const mockProfile = { transport: 'Car (Gasoline)', diet: 'Average', energy: 'Grid (Mixed)', householdSize: 2 };
const mockActions: unknown[] = [];

jest.mock('@/context/ProfileContext', () => ({
  useProfile: () => ({
    profile: mockProfile,
    actions: mockActions,
    logAction: mockLogAction,
  }),
}));

// Mock ReactMarkdown
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <span>{children}</span>;
  };
});
jest.mock('rehype-sanitize', () => ({}));

// Mock Metrics
jest.mock("@/lib/metrics", () => ({
  PREDEFINED_ACTIONS: [
    { id: "bike_commute", name: "Bike Commute", category: "Transport", co2Saved: 3.5 }
  ],
}));

describe('SmartAssistant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.Mock;
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    // Clear localStorage
    localStorage.clear();
  });

  it('renders initial greeting message', () => {
    render(<SmartAssistant />);
    expect(screen.getByText(/Hi! I'm your Smart Carbon Assistant/i)).toBeInTheDocument();
  });

  it('renders chat input and send button', () => {
    render(<SmartAssistant />);
    expect(screen.getByPlaceholderText('Ask me for tips...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send message/i })).toBeInTheDocument();
  });

  it('adds user message to chat on Enter key press and shows offline fallback when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<SmartAssistant />);
    
    const input = screen.getByPlaceholderText('Ask me for tips...');
    fireEvent.change(input, { target: { value: 'How can I save energy?' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    // User message should appear
    expect(await screen.findByText('How can I save energy?')).toBeInTheDocument();
    
    // Input should be cleared
    expect(input).toHaveValue('');
    
    // Fallback message should appear
    await waitFor(() => {
      expect(screen.getByText(/Using offline mode/i)).toBeInTheDocument();
    });
  });

  it('disables send button while typing', async () => {
    // Create an unresolved promise to simulate pending request
    let resolvePromise: unknown;
    const pendingPromise = new Promise(resolve => { resolvePromise = resolve; });
    (global.fetch as jest.Mock).mockReturnValueOnce(pendingPromise);

    render(<SmartAssistant />);
    
    const input = screen.getByPlaceholderText('Ask me for tips...');
    const sendButton = screen.getByRole('button', { name: /Send message/i });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    // Should show thinking indicator
    expect(await screen.findByText('Thinking...')).toBeInTheDocument();
    
    // Send button should be disabled
    expect(sendButton).toBeDisabled();

    // Resolve the promise to cleanup
    resolvePromise({ ok: false });
  });

  it('retries when retry button is clicked', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<SmartAssistant />);
    
    const input = screen.getByPlaceholderText('Ask me for tips...');
    fireEvent.change(input, { target: { value: 'Retry test' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText(/Using offline mode/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /Retry last message/i });
    expect(retryButton).toBeInTheDocument();

    // Setup success for retry
    let resolvePromise: unknown;
    const pendingPromise = new Promise(resolve => { resolvePromise = resolve; });
    (global.fetch as jest.Mock).mockReturnValueOnce(pendingPromise);

    fireEvent.click(retryButton);

    expect(await screen.findByText('Thinking...')).toBeInTheDocument();
    resolvePromise({ ok: false });
  });

  it('handles streaming response and tool calls', async () => {
    // Mock a readable stream reader
    let step = 0;
    const encoder = new (require('util').TextEncoder)();
    
    const mockReader = {
      read: jest.fn().mockImplementation(() => {
        if (step === 0) {
          step++;
          return Promise.resolve({ done: false, value: encoder.encode('Hello') });
        } else if (step === 1) {
          step++;
          return Promise.resolve({ done: false, value: encoder.encode(' World!') });
        } else if (step === 2) {
          step++;
          return Promise.resolve({ done: false, value: encoder.encode('{"type":"tool_call","actionId":"bike_commute"}--END_TOOL_CALL--') });
        } else {
          return Promise.resolve({ done: true, value: undefined });
        }
      })
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      body: { getReader: () => mockReader }
    });

    render(<SmartAssistant />);
    
    const input = screen.getByPlaceholderText('Ask me for tips...');
    fireEvent.change(input, { target: { value: 'Stream test' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Hello World!')).toBeInTheDocument();
    });

    // Expect logAction to be called
    await waitFor(() => {
      expect(mockLogAction).toHaveBeenCalledWith({
        name: "Bike Commute",
        category: "Transport",
        co2Saved: 3.5
      });
    });

    // Toast should be displayed
    expect(screen.getByText(/✓ Logged: Bike Commute/)).toBeInTheDocument();
  });
});
