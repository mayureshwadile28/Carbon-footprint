"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { TransportOption, DietOption, EnergyOption } from "@/lib/constants";

export type ProfileData = {
  transport: TransportOption;
  diet: DietOption;
  energy: EnergyOption;
  householdSize: number;
};

export type ActionData = {
  id: string;
  name: string;
  category: "Transport" | "Diet" | "Energy" | "Shopping";
  co2Saved: number; // in kg
  date: string;
};

/** Generate a unique ID, preferring crypto.randomUUID when available. */
function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).substr(2, 9);
  }
}

interface ProfileContextType {
  isOnboarded: boolean;
  isLoaded: boolean;
  profile: ProfileData | null;
  actions: ActionData[];
  saveProfile: (data: ProfileData) => void;
  logAction: (action: Omit<ActionData, "id" | "date">) => void;
  resetData: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [actions, setActions] = useState<ActionData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem("carbon_profile");
      const storedActions = localStorage.getItem("carbon_actions");
      
      if (storedProfile) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProfile(JSON.parse(storedProfile));
        setIsOnboarded(true);
      }
      if (storedActions) {
        setActions(JSON.parse(storedActions));
      }
    } catch {
      // Failed to parse stored data, reset silently
      localStorage.removeItem("carbon_profile");
      localStorage.removeItem("carbon_actions");
    }
    setIsLoaded(true);
  }, []);

  const saveProfile = (data: ProfileData) => {
    setProfile(data);
    setIsOnboarded(true);
    localStorage.setItem("carbon_profile", JSON.stringify(data));
  };

  const logAction = (actionData: Omit<ActionData, "id" | "date">) => {
    const newAction: ActionData = {
      ...actionData,
      id: generateId(),
      date: new Date().toISOString(),
    };
    const updatedActions = [newAction, ...actions];
    setActions(updatedActions);
    localStorage.setItem("carbon_actions", JSON.stringify(updatedActions));
  };

  const resetData = () => {
    setProfile(null);
    setIsOnboarded(false);
    setActions([]);
    localStorage.removeItem("carbon_profile");
    localStorage.removeItem("carbon_actions");
    localStorage.removeItem("carbon_chat_history");
  };

  return (
    <ProfileContext.Provider value={{ isOnboarded, isLoaded, profile, actions, saveProfile, logAction, resetData }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
