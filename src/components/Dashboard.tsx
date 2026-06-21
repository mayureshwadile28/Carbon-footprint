"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { useProfile } from "@/context/ProfileContext";
import { calculateAnnualFootprint } from "@/lib/carbonLogic";
import ActionLogger from "./ActionLogger";
import ErrorBoundaryPanel from "./ErrorBoundaryPanel";

/** Lazy-load heavy components with skeleton placeholders */
const EmissionsChart = dynamic(() => import("./EmissionsChart"), {
  ssr: false,
  loading: () => <div className="dashboard-chart-container skeleton" aria-hidden="true" />,
});

const SavingsChart = dynamic(() => import("./SavingsChart"), {
  ssr: false,
  loading: () => <div className="dashboard-recent-chart skeleton" aria-hidden="true" />,
});

const SmartAssistant = dynamic(() => import("./SmartAssistant"), {
  ssr: false,
  loading: () => <div className="glass-panel chat-container skeleton" aria-hidden="true" />,
});

export default function Dashboard() {
  const { profile, actions, resetData } = useProfile();

  const { total, breakdown } = useMemo(() => calculateAnnualFootprint(profile), [profile]);

  const totalSaved = useMemo(() => actions.reduce((sum, a) => sum + a.co2Saved, 0), [actions]);
  const currentTotal = useMemo(() => Math.max(0, total - totalSaved), [total, totalSaved]);

  const recentActionsData = useMemo(
    () =>
      actions.slice(0, 5).map(a => ({
        name: a.name.length > 10 ? a.name.substring(0, 10) + "..." : a.name,
        saved: a.co2Saved
      })).reverse(),
    [actions]
  );

  return (
    <div className="container animate-fade-in">
      <header className="dashboard-header">
        <div>
          <h1 className="text-gradient dashboard-title">Your Footprint Dashboard</h1>
          <p className="dashboard-subtitle">Track, analyze, and reduce your carbon emissions.</p>
        </div>
        <button className="btn-secondary" onClick={resetData} aria-label="Reset Profile">Reset Profile</button>
      </header>

      <div className="grid-2 dashboard-grid">
        <section className="glass-panel dashboard-stat-card" aria-labelledby="footprint-heading">
          <h2 id="footprint-heading" className="dashboard-stat-title">Estimated Annual Footprint</h2>
          <div className="dashboard-stat-value">
            {currentTotal} <span className="dashboard-stat-unit">kg CO₂</span>
          </div>
          {totalSaved > 0 && (
            <div className="dashboard-stat-saved" aria-live="polite">
              -{totalSaved} kg saved through your actions!
            </div>
          )}
        </section>

        <section className="glass-panel" aria-labelledby="breakdown-heading">
          <h2 id="breakdown-heading" className="dashboard-panel-title">Emissions Breakdown</h2>
          <ErrorBoundaryPanel fallbackMessage="Chart failed to load. Try refreshing.">
            <EmissionsChart breakdown={breakdown} />
          </ErrorBoundaryPanel>

          {/* Accessible data table for screen readers */}
          <table className="sr-only" aria-label="Emissions breakdown data">
            <thead>
              <tr><th>Category</th><th>CO₂ (kg/year)</th></tr>
            </thead>
            <tbody>
              {breakdown.map(item => (
                <tr key={item.name}><td>{item.name}</td><td>{item.value}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <div className="grid-2">
        <ErrorBoundaryPanel fallbackMessage="Smart Assistant failed to load. Try refreshing.">
          <SmartAssistant />
        </ErrorBoundaryPanel>
        <div className="dashboard-col">
          <ErrorBoundaryPanel fallbackMessage="Action Logger failed to load. Try refreshing.">
            <ActionLogger />
          </ErrorBoundaryPanel>
          {actions.length > 0 ? (
            <section className="glass-panel dashboard-recent-panel" aria-labelledby="savings-heading">
              <h2 id="savings-heading" className="dashboard-panel-title">Recent Savings</h2>
              <ErrorBoundaryPanel fallbackMessage="Savings chart failed to load.">
                <SavingsChart data={recentActionsData} />
              </ErrorBoundaryPanel>
            </section>
          ) : (
            <section className="glass-panel dashboard-recent-panel" aria-labelledby="savings-heading-empty">
              <h2 id="savings-heading-empty" className="dashboard-panel-title">Recent Savings</h2>
              <div className="empty-state">
                <div className="empty-state-icon" aria-hidden="true">🌱</div>
                <p>Log your first green action to see your impact here!</p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
