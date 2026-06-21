import { calculateAnnualFootprint, getSmartAssistantReply } from '../carbonLogic';
import { ProfileData, ActionData } from '@/context/ProfileContext';
describe('calculateAnnualFootprint', () => {
  it('calculates the baseline correctly for default values', () => {
    const profile: ProfileData = {
      transport: 'Car (Gasoline)',
      diet: 'Average',
      energy: 'Grid (Mixed)',
      householdSize: 1,
    };

    const { total, breakdown } = calculateAnnualFootprint(profile);

    // Baseline = Transport (4000) + Diet (2500) + Energy (3500 / 1)
    // None of the multiplier conditions match, so raw baselines apply.
    expect(total).toBe(10000);
    expect(breakdown.length).toBe(3);
    expect(breakdown.find(b => b.name === 'Transport')?.value).toBe(4000);
    expect(breakdown.find(b => b.name === 'Diet')?.value).toBe(2500);
    expect(breakdown.find(b => b.name === 'Home Energy')?.value).toBe(3500);
  });

  it('adjusts baseline accurately for Electric Vehicle and Vegan diet', () => {
    const profile: ProfileData = {
      transport: 'Car (Electric)', // 4000 * 0.4 = 1600
      diet: 'Vegan', // 2500 * 0.4 = 1000
      energy: 'Grid (Mixed)',
      householdSize: 1,
    };

    const { total, breakdown } = calculateAnnualFootprint(profile);

    expect(total).toBe(1600 + 1000 + 3500);
    expect(breakdown.find(b => b.name === 'Transport')?.value).toBe(1600);
    expect(breakdown.find(b => b.name === 'Diet')?.value).toBe(1000);
  });

  it('divides home energy accurately by household size', () => {
    const profile: ProfileData = {
      transport: 'Car (Gasoline)', // 4000 (no multiplier matches)
      diet: 'Average', // 2500 (no multiplier matches)
      energy: 'Grid (Mixed)', // 3500
      householdSize: 4, // 3500 / 4 = 875
    };

    const { total, breakdown } = calculateAnnualFootprint(profile);

    expect(total).toBe(4000 + 2500 + 875);
    expect(breakdown.find(b => b.name === 'Home Energy')?.value).toBe(875);
  });

  it('handles null profile by returning 0', () => {
    const { total, breakdown } = calculateAnnualFootprint(null);
    expect(total).toBe(0);
    expect(breakdown.length).toBe(0);
  });

  // --- Edge case tests ---

  it('applies Meat Heavy diet multiplier (1.3x)', () => {
    const profile: ProfileData = {
      transport: 'Car (Gasoline)',
      diet: 'Meat Heavy', // 2500 * 1.3 = 3250
      energy: 'Grid (Mixed)',
      householdSize: 1,
    };

    const { total, breakdown } = calculateAnnualFootprint(profile);

    expect(breakdown.find(b => b.name === 'Diet')?.value).toBe(3250);
    expect(total).toBe(4000 + 3250 + 3500);
  });

  it('applies Public Transit transport multiplier (0.3x)', () => {
    const profile: ProfileData = {
      transport: 'Public Transit', // 4000 * 0.3 = 1200
      diet: 'Average',
      energy: 'Grid (Mixed)',
      householdSize: 1,
    };

    const { total, breakdown } = calculateAnnualFootprint(profile);

    expect(breakdown.find(b => b.name === 'Transport')?.value).toBe(1200);
    expect(total).toBe(1200 + 2500 + 3500);
  });

  it('applies 100% Renewable energy multiplier (0.2x)', () => {
    const profile: ProfileData = {
      transport: 'Car (Gasoline)',
      diet: 'Average',
      energy: '100% Renewable', // 3500 / 1 * 0.2 = 700
      householdSize: 1,
    };

    const { total, breakdown } = calculateAnnualFootprint(profile);

    expect(breakdown.find(b => b.name === 'Home Energy')?.value).toBe(700);
    expect(total).toBe(4000 + 2500 + 700);
  });

  it('combines all modifiers: Bicycle, Vegan, Solar Off-grid, household 2', () => {
    const profile: ProfileData = {
      transport: 'Bicycle / Walking', // 4000 * 0.05 = 200
      diet: 'Vegan', // 2500 * 0.4 = 1000
      energy: 'Solar (Off-grid)', // 3500 / 2 * 0.05 = 87.5 -> 88 rounded
      householdSize: 2,
    };

    const { total, breakdown } = calculateAnnualFootprint(profile);

    expect(breakdown.find(b => b.name === 'Transport')?.value).toBe(200);
    expect(breakdown.find(b => b.name === 'Diet')?.value).toBe(1000);
    expect(breakdown.find(b => b.name === 'Home Energy')?.value).toBe(88);
    expect(total).toBe(200 + 1000 + 88);
  });
});

describe('getSmartAssistantReply', () => {
  const veganProfile: ProfileData = {
    transport: 'Bicycle / Walking',
    diet: 'Vegan',
    energy: '100% Renewable',
    householdSize: 2,
  };

  const vegetarianProfile: ProfileData = {
    transport: 'Car (Gasoline)',
    diet: 'Vegetarian',
    energy: 'Grid (Mixed)',
    householdSize: 1,
  };

  const defaultProfile: ProfileData = {
    transport: 'Car (Gasoline)',
    diet: 'Average',
    energy: 'Grid (Mixed)',
    householdSize: 1,
  };

  const renewableProfile: ProfileData = {
    transport: 'Public Transit',
    diet: 'Average',
    energy: '100% Renewable',
    householdSize: 3,
  };

  const sampleActions: ActionData[] = [
    { id: 'a1', name: 'Bike Commute', category: 'Transport', co2Saved: 3.5, date: '2026-06-01' },
    { id: 'a2', name: 'Meatless Day', category: 'Diet', co2Saved: 5.2, date: '2026-06-02' },
  ];

  it('returns profile prompt when profile is null', () => {
    const reply = getSmartAssistantReply('hello', null, []);
    expect(reply).toContain('Please complete your profile');
  });

  it('returns vegan food tip when diet is Vegan', () => {
    const reply = getSmartAssistantReply('Tell me about food', veganProfile, []);
    expect(reply).toContain("you're already vegan");
    expect(reply).toContain('locally sourced');
  });

  it('returns vegetarian food tip when diet is Vegetarian', () => {
    const reply = getSmartAssistantReply('What should I eat?', vegetarianProfile, []);
    expect(reply).toContain('vegetarian');
    expect(reply).toContain('oat milk');
  });

  it('returns default food tip for non-veg/non-vegetarian diet', () => {
    const reply = getSmartAssistantReply('How can I improve my diet?', defaultProfile, []);
    expect(reply).toContain('Meatless Mondays');
  });

  it('returns bicycle transport tip for Bicycle / Walking', () => {
    const reply = getSmartAssistantReply('How do I improve transport?', veganProfile, []);
    expect(reply).toContain('greenest transport');
    expect(reply).toContain('train');
  });

  it('returns gasoline transport tip for Car (Gasoline)', () => {
    const reply = getSmartAssistantReply('Tell me about my car and driving', defaultProfile, []);
    expect(reply).toContain('gasoline car');
    expect(reply).toContain('carpool');
  });

  it('returns default transport tip for EV or Public Transit', () => {
    const reply = getSmartAssistantReply('What about my travel?', renewableProfile, []);
    expect(reply).toContain('EV or Public Transit');
  });

  it('returns renewable energy tip for 100% Renewable or Solar', () => {
    const reply = getSmartAssistantReply('Tell me about my energy usage', renewableProfile, []);
    expect(reply).toContain('clean energy');
    expect(reply).toContain('insulation');
  });

  it('returns default energy tip for non-renewable energy', () => {
    const reply = getSmartAssistantReply('How to save electricity?', defaultProfile, []);
    expect(reply).toContain('thermostat');
    expect(reply).toContain('green energy');
  });

  it('returns a personalized greeting on hi/hello', () => {
    const reply = getSmartAssistantReply('hello', defaultProfile, []);
    expect(reply).toContain('Hi there!');
    expect(reply).toContain(defaultProfile.transport);
    expect(reply).toContain(defaultProfile.diet);
  });

  it('returns actions summary when user has logged actions and message is generic', () => {
    const reply = getSmartAssistantReply('what can I do next', defaultProfile, sampleActions);
    // The best action is "Meatless Day" with 5.2kg
    expect(reply).toContain('5.2');
    expect(reply).toContain('Meatless Day');
  });

  it('returns default message when no keywords match and no actions', () => {
    const reply = getSmartAssistantReply('random gibberish xyz', defaultProfile, []);
    expect(reply).toContain('Smart Carbon Assistant');
    expect(reply).toContain('transport, food, or energy');
  });
});
