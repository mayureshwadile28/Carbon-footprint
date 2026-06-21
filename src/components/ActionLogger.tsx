"use client";

import React, { useState } from "react";
import { useProfile } from "@/context/ProfileContext";
import { PREDEFINED_ACTIONS } from "@/lib/metrics";

export default function ActionLogger() {
  const { logAction } = useProfile();
  const [selectedActionId, setSelectedActionId] = useState(PREDEFINED_ACTIONS[0].id);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLog = () => {
    const action = PREDEFINED_ACTIONS.find(a => a.id === selectedActionId);
    if (!action) return;
    
    logAction({ 
      name: action.name, 
      category: action.category, 
      co2Saved: action.co2Saved 
    });

    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 1500);
  };

  return (
    <div className="glass-panel action-logger-container">
      <h3 className="action-logger-header">Log Green Action</h3>
      
      <div className="action-logger-form">
        <div>
          <label htmlFor="action-select" className="action-logger-label">Select Action</label>
          <select 
            id="action-select"
            className="input-field action-logger-select" 
            value={selectedActionId}
            onChange={e => setSelectedActionId(e.target.value)}
            aria-label="Select a green action to log"
          >
            {PREDEFINED_ACTIONS.map(action => (
              <option key={action.id} value={action.id}>
                {action.name} (-{action.co2Saved}kg CO2)
              </option>
            ))}
          </select>
        </div>

        <div className="action-logger-info">
          Logging this predefined action accurately calculates its real-world impact based on average carbon metrics.
        </div>

        <button 
          className={`btn-primary action-logger-btn ${isSuccess ? 'btn-success' : ''}`} 
          onClick={handleLog} 
          aria-label={isSuccess ? "Action logged successfully" : "Log Action"}
        >
          {isSuccess ? "✓ Logged!" : "Log Action"}
        </button>
      </div>
    </div>
  );
}
