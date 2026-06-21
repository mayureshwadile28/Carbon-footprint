import { ProfileData, ActionData } from "@/context/ProfileContext";

/** Represents a single category in the emissions breakdown. */
export type BreakdownItem = {
  name: string;
  value: number;
};

/**
 * Annual baseline CO2 emissions in kg per year for an average individual.
 * Sources: EPA GHG Equivalencies, Our World in Data.
 * - Transport: avg personal vehicle ~4,000 kg CO2/year
 * - Diet: avg omnivore ~2,500 kg CO2/year
 * - Energy: avg household ~3,500 kg CO2/year (divided by household size)
 */
const BASELINES = {
  transport: 4000,
  diet: 2500,
  energy: 3500,
};

/**
 * Calculates the estimated annual carbon footprint based on user profile data.
 * Applies science-based multipliers to national-average baselines for transport,
 * diet, and home energy, producing a per-person annual CO2e estimate in kg.
 *
 * @param profile - The user's lifestyle profile, or null if not yet onboarded.
 * @returns An object containing the total annual CO2e (kg) and a category breakdown.
 */
export function calculateAnnualFootprint(profile: ProfileData | null): { total: number; breakdown: BreakdownItem[] } {
  if (!profile) return { total: 0, breakdown: [] };

  let transportScore = BASELINES.transport;
  if (profile.transport === "Car (Electric)") transportScore *= 0.4;
  if (profile.transport === "Public Transit") transportScore *= 0.3;
  if (profile.transport === "Bicycle / Walking") transportScore *= 0.05;

  let dietScore = BASELINES.diet;
  if (profile.diet === "Vegetarian") dietScore *= 0.6;
  if (profile.diet === "Vegan") dietScore *= 0.4;
  if (profile.diet === "Meat Heavy") dietScore *= 1.3;

  let energyScore = BASELINES.energy / profile.householdSize;
  if (profile.energy === "100% Renewable") energyScore *= 0.2;
  if (profile.energy === "Solar (Off-grid)") energyScore *= 0.05;

  const total = transportScore + dietScore + energyScore;

  return {
    total: Math.round(total),
    breakdown: [
      { name: "Transport", value: Math.round(transportScore) },
      { name: "Diet", value: Math.round(dietScore) },
      { name: "Home Energy", value: Math.round(energyScore) },
    ]
  };
}

/**
 * Local rule-engine fallback for the Smart Assistant. Provides context-aware
 * carbon reduction tips based on the user's profile and logged actions.
 * Used as an offline fallback when the Gemini API is unavailable.
 *
 * @param message - The user's chat message.
 * @param profile - The user's lifestyle profile, or null if not onboarded.
 * @param actions - The user's logged green actions.
 * @returns A personalized tip string based on keyword matching and profile context.
 */
export function getSmartAssistantReply(message: string, profile: ProfileData | null, actions: ActionData[]): string {
  const lowerMsg = message.toLowerCase();
  
  if (!profile) return "Please complete your profile so I can give you personalized advice!";

  if (lowerMsg.includes("food") || lowerMsg.includes("diet") || lowerMsg.includes("eat")) {
    if (profile.diet === "Vegan") {
      return "Since you're already vegan, you're doing amazing! To reduce your food footprint further, try focusing on locally sourced and seasonal produce to cut down on food miles.";
    } else if (profile.diet === "Vegetarian") {
      return "As a vegetarian, you've cut down a lot. If you want to take it further, try reducing dairy or swapping regular milk for oat milk—it has a much lower carbon footprint.";
    } else {
      return "A great start for you would be trying 'Meatless Mondays'. Cutting out beef just one day a week can save about 250kg of CO2 per year!";
    }
  }

  if (lowerMsg.includes("transport") || lowerMsg.includes("car") || lowerMsg.includes("drive") || lowerMsg.includes("travel")) {
    if (profile.transport === "Bicycle / Walking") {
      return "You're already using the greenest transport! Keep it up. For longer trips, consider taking a train instead of flying.";
    } else if (profile.transport === "Car (Gasoline)") {
      return "Since you drive a gasoline car, could you carpool or take public transit one day a week? Even proper tire inflation can improve mileage by 3%, saving gas and emissions.";
    } else {
      return "Using an EV or Public Transit is great! Make sure to charge your EV during off-peak hours if your grid is cleaner at night.";
    }
  }

  if (lowerMsg.includes("energy") || lowerMsg.includes("electricity") || lowerMsg.includes("heat")) {
    if (profile.energy === "100% Renewable" || profile.energy === "Solar (Off-grid)") {
      return "You have a great clean energy setup! Your next step could be improving home insulation or upgrading to energy-efficient appliances.";
    } else {
      return "Consider turning your thermostat down by just 1 degree in winter and up 1 degree in summer. Also, check if your utility provider offers a 'green energy' switch—it's often a free option!";
    }
  }

  if (lowerMsg.includes("hi") || lowerMsg.includes("hello")) {
    return `Hi there! Based on your profile (${profile.transport}, ${profile.diet}), I have some great custom tips. What area do you want to focus on: Diet, Transport, or Energy?`;
  }

  if (actions.length > 0) {
    const bestAction = actions.reduce((prev, current) => (prev.co2Saved > current.co2Saved) ? prev : current);
    return `I see you recently saved ${bestAction.co2Saved}kg CO2 by '${bestAction.name}'. Awesome job! Ask me about Transport, Diet, or Energy for more tips.`;
  }

  return "I'm your Smart Carbon Assistant. I adapt to your specific lifestyle. Ask me how to reduce your footprint in transport, food, or energy!";
}

