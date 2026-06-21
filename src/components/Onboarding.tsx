"use client";

import React, { useState } from "react";
import { useProfile, ProfileData } from "@/context/ProfileContext";
import { TRANSPORT_OPTIONS, DIET_OPTIONS, ENERGY_OPTIONS } from "@/lib/constants";

export default function Onboarding() {
  const { saveProfile } = useProfile();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ProfileData>({
    transport: TRANSPORT_OPTIONS[0],
    diet: DIET_OPTIONS[0],
    energy: ENERGY_OPTIONS[0],
    householdSize: 1,
  });

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);
  
  const handleFinish = () => {
    saveProfile(formData);
  };

  return (
    <div className="onboarding-wrapper container">
      <div className="glass-panel animate-fade-in onboarding-card">
        <h1 className="onboarding-heading text-gradient">Welcome to CarbonFootprint</h1>
        <p className="onboarding-subheading">Let&apos;s personalize your experience to help you reduce your impact.</p>

        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="onboarding-question">How do you usually commute?</h2>
            <div className="grid-2" role="radiogroup" aria-label="Transport options">
              {TRANSPORT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  className={formData.transport === opt ? "btn-primary" : "btn-secondary"}
                  role="radio"
                  aria-checked={formData.transport === opt}
                  onClick={() => { setFormData({ ...formData, transport: opt }); handleNext(); }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="onboarding-question">What best describes your diet?</h2>
            <div className="grid-2" role="radiogroup" aria-label="Diet options">
              {DIET_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  className={formData.diet === opt ? "btn-primary" : "btn-secondary"}
                  role="radio"
                  aria-checked={formData.diet === opt}
                  onClick={() => { setFormData({ ...formData, diet: opt }); handleNext(); }}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="onboarding-nav-single">
              <button className="btn-secondary" onClick={handleBack}>Back</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="onboarding-question">What&apos;s your primary home energy source?</h2>
            <div className="grid-2" role="radiogroup" aria-label="Energy options">
              {ENERGY_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  className={formData.energy === opt ? "btn-primary" : "btn-secondary"}
                  role="radio"
                  aria-checked={formData.energy === opt}
                  onClick={() => { setFormData({ ...formData, energy: opt }); handleNext(); }}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="onboarding-nav-single">
              <button className="btn-secondary" onClick={handleBack}>Back</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in">
            <h2 className="onboarding-question">How many people live in your household?</h2>
            <div className="onboarding-household-group" role="radiogroup" aria-label="Household size">
              {[1, 2, 3, 4, 5].map((opt) => (
                <button
                  key={opt}
                  className={`onboarding-household-btn ${formData.householdSize === opt ? "btn-primary" : "btn-secondary"}`}
                  role="radio"
                  aria-checked={formData.householdSize === opt}
                  onClick={() => setFormData({ ...formData, householdSize: opt })}
                >
                  {opt}{opt === 5 ? "+" : ""}
                </button>
              ))}
            </div>
            <div className="onboarding-nav-split">
              <button className="btn-secondary" onClick={handleBack}>Back</button>
              <button className="btn-primary" onClick={handleFinish} disabled={!formData.householdSize}>
                Complete Profile
              </button>
            </div>
          </div>
        )}
        
        {/* Accessible step indicator */}
        <div className="onboarding-steps" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4} aria-label={`Step ${step} of 4`}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`onboarding-step-dot ${step === i ? "onboarding-step-active" : ""}`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
