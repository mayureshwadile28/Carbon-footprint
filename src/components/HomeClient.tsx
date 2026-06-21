"use client";

import { useProfile } from "@/context/ProfileContext";
import Onboarding from "@/components/Onboarding";
import Dashboard from "@/components/Dashboard";

export default function HomeClient() {
  const { isOnboarded, isLoaded } = useProfile();

  // Prevent flash of Onboarding before localStorage hydration completes
  if (!isLoaded) {
    return <main style={{ minHeight: "100vh" }} aria-busy="true" />;
  }

  return (
    <main aria-label="Carbon Footprint Application">
      {!isOnboarded ? <Onboarding /> : <Dashboard />}
    </main>
  );
}
