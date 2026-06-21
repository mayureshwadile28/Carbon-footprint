import React from "react";
import { render, screen } from "@testing-library/react";
import SavingsChart from "../SavingsChart";

/* ------------------------------------------------------------------ */
/*  Mocks                                                             */
/* ------------------------------------------------------------------ */

jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

const sampleData = [
  { name: "Bike/Walk...", saved: 3.5 },
  { name: "Meatless...", saved: 5.2 },
];

describe("SavingsChart", () => {
  it("renders without crashing with valid data", () => {
    const { container } = render(<SavingsChart data={sampleData} />);
    expect(container).toBeTruthy();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("renders with empty data array", () => {
    const { container } = render(<SavingsChart data={[]} />);
    expect(container).toBeTruthy();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });
});
