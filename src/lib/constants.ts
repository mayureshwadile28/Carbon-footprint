/**
 * Centralized constants for profile options.
 * Single source of truth — used by Onboarding UI, carbonLogic calculations, and tests.
 */

export const TRANSPORT_OPTIONS = ["Car (Gasoline)", "Car (Electric)", "Public Transit", "Bicycle / Walking"] as const;
export type TransportOption = typeof TRANSPORT_OPTIONS[number];

export const DIET_OPTIONS = ["Meat Heavy", "Average", "Vegetarian", "Vegan"] as const;
export type DietOption = typeof DIET_OPTIONS[number];

export const ENERGY_OPTIONS = ["Grid (Mixed)", "100% Renewable", "Natural Gas", "Solar (Off-grid)"] as const;
export type EnergyOption = typeof ENERGY_OPTIONS[number];
