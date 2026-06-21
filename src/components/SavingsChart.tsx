"use client";

import React, { memo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface SavingsChartProps {
  data: { name: string; saved: number }[];
}

/** Bar chart component for recent savings — loaded lazily by Dashboard. */
function SavingsChart({ data }: SavingsChartProps) {
  return (
    <div className="dashboard-recent-chart" role="img" aria-label={`Bar chart showing recent savings: ${data.map(d => `${d.name} ${d.saved}kg`).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
          <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
            contentStyle={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--surface-border)", borderRadius: "8px", color: "white" }}
          />
          <Bar dataKey="saved" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default memo(SavingsChart);
