"use client";

import React, { memo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import type { BreakdownItem } from "@/lib/carbonLogic";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

interface EmissionsChartProps {
  breakdown: BreakdownItem[];
}

/** Pie chart component for emissions breakdown — loaded lazily by Dashboard. */
function EmissionsChart({ breakdown }: EmissionsChartProps) {
  return (
    <>
      <div className="dashboard-chart-container" role="img" aria-label={`Pie chart showing emissions: ${breakdown.map(b => `${b.name} ${b.value}kg`).join(', ')}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={breakdown}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {breakdown.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--surface-border)", borderRadius: "8px", color: "white" }}
              itemStyle={{ color: "white" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="dashboard-legend">
        {breakdown.map((item, idx) => (
          <div key={item.name} className="dashboard-legend-item">
            <div className="dashboard-legend-color" style={{ backgroundColor: COLORS[idx] }} aria-hidden="true" />
            {item.name}
          </div>
        ))}
      </div>
    </>
  );
}

export default memo(EmissionsChart);
