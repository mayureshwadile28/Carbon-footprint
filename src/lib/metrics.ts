export type PredefinedAction = {
  id: string;
  name: string;
  category: "Transport" | "Diet" | "Energy" | "Shopping";
  co2Saved: number; // in kg CO2e
};

export const PREDEFINED_ACTIONS: PredefinedAction[] = [
  { id: "meatless_monday", name: "Meatless Day", category: "Diet", co2Saved: 5.2 },
  { id: "vegan_meal", name: "Vegan Meal", category: "Diet", co2Saved: 1.5 },
  { id: "bike_commute", name: "Bike/Walk Commute", category: "Transport", co2Saved: 3.5 },
  { id: "public_transit", name: "Public Transit Commute", category: "Transport", co2Saved: 2.1 },
  { id: "carpool", name: "Carpool to Work", category: "Transport", co2Saved: 4.0 },
  { id: "line_dry", name: "Line Dry Clothes", category: "Energy", co2Saved: 1.2 },
  { id: "led_bulb", name: "Install LED Bulb", category: "Energy", co2Saved: 0.5 },
  { id: "cold_wash", name: "Cold Water Wash", category: "Energy", co2Saved: 0.8 },
  { id: "second_hand", name: "Buy Second Hand", category: "Shopping", co2Saved: 10.0 },
  { id: "reusable_bag", name: "Use Reusable Bag", category: "Shopping", co2Saved: 0.1 },
];
