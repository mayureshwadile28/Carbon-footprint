import React from "react";
import { render, screen } from "@testing-library/react";
import EmissionsChart from "../EmissionsChart";

/* ------------------------------------------------------------------ */
/*  Mocks                                                             */
/* ------------------------------------------------------------------ */

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

const sampleBreakdown = [
  { name: "Transport", value: 4000 },
  { name: "Diet", value: 2500 },
  { name: "Home Energy", value: 1750 },
];

describe("EmissionsChart", () => {
  it("renders without crashing with valid data", () => {
    const { container } = render(
      <EmissionsChart breakdown={sampleBreakdown} />
    );
    expect(container).toBeTruthy();
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
  });

  it("renders legend items matching breakdown categories", () => {
    render(<EmissionsChart breakdown={sampleBreakdown} />);
    expect(screen.getByText("Transport")).toBeInTheDocument();
    expect(screen.getByText("Diet")).toBeInTheDocument();
    expect(screen.getByText("Home Energy")).toBeInTheDocument();
  });

  it("renders correct number of legend items", () => {
    render(<EmissionsChart breakdown={sampleBreakdown} />);
    const legendItems = screen
      .getAllByText(/Transport|Diet|Home Energy/)
      .filter((el) => el.classList.contains("dashboard-legend-item") || el.closest(".dashboard-legend-item"));
    expect(legendItems).toHaveLength(3);
  });
});
