import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Dashboard from "../Dashboard";

/* ------------------------------------------------------------------ */
/*  Mocks                                                             */
/* ------------------------------------------------------------------ */

const mockResetData = jest.fn();
const mockProfile = {
  transport: "Car (Gasoline)",
  diet: "Average",
  energy: "Grid (Mixed)",
  householdSize: 2,
};
const mockActions = [
  {
    id: "1",
    name: "Bike Commute",
    category: "Transport" as const,
    co2Saved: 3.5,
    date: "2026-01-01",
  },
];

jest.mock("@/context/ProfileContext", () => ({
  useProfile: () => ({
    profile: mockProfile,
    actions: mockActions,
    resetData: mockResetData,
  }),
}));

// Mock all child components to avoid rendering their full trees
jest.mock("../EmissionsChart", () => {
  return function MockChart() {
    return <div data-testid="emissions-chart">Chart</div>;
  };
});
jest.mock("../SavingsChart", () => {
  return function MockChart() {
    return <div data-testid="savings-chart">Chart</div>;
  };
});
jest.mock("../SmartAssistant", () => {
  return function MockAssistant() {
    return <div data-testid="smart-assistant">Assistant</div>;
  };
});
jest.mock("../ActionLogger", () => {
  return function MockLogger() {
    return <div data-testid="action-logger">Logger</div>;
  };
});

// Mock next/dynamic — immediately resolve the dynamic import
jest.mock('next/dynamic', () => {
  return (loader: () => Promise<unknown>) => {
    // Return a placeholder that renders immediately
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const LazyComp = React.lazy(loader as any);
    return function DynamicWrapper(p: Record<string, unknown>) {
      return React.createElement(React.Suspense, { fallback: null }, React.createElement(LazyComp, p));
    };
  };
});

// Mock carbonLogic
jest.mock("@/lib/carbonLogic", () => ({
  calculateAnnualFootprint: jest.fn().mockReturnValue({
    total: 8250,
    breakdown: [
      { name: "Transport", value: 4000 },
      { name: "Diet", value: 2500 },
      { name: "Home Energy", value: 1750 },
    ],
  }),
}));

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe("Dashboard", () => {
  it("renders the dashboard title 'Your Footprint Dashboard'", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    expect(screen.getByText("Your Footprint Dashboard")).toBeInTheDocument();
  });

  it("renders the estimated footprint value", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    // total (8250) - totalSaved (3.5) = 8246.5 => Math.max(0, 8246.5)
    const statValue = screen.getByText((_content, element) => {
      return element?.classList.contains("dashboard-stat-value") === true &&
        element?.textContent?.includes("8246.5") === true;
    });
    expect(statValue).toBeInTheDocument();
    expect(screen.getByText("kg CO₂")).toBeInTheDocument();
  });

  it("renders the 'kg saved' badge when actions exist", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    expect(
      screen.getByText((_content, element) => {
        return element?.textContent === "-3.5 kg saved through your actions!";
      })
    ).toBeInTheDocument();
  });

  it("renders Reset Profile button", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    expect(screen.getByLabelText("Reset Profile")).toBeInTheDocument();
  });

  it("calls resetData when Reset Profile is clicked", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    const resetBtn = screen.getByLabelText("Reset Profile");
    fireEvent.click(resetBtn);
    expect(mockResetData).toHaveBeenCalledTimes(1);
  });
});
