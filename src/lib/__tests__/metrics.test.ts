import { PREDEFINED_ACTIONS, PredefinedAction } from '../metrics';

describe('PREDEFINED_ACTIONS', () => {
  it('has at least 8 entries', () => {
    expect(PREDEFINED_ACTIONS.length).toBeGreaterThanOrEqual(8);
  });

  it('every action has a non-empty id', () => {
    PREDEFINED_ACTIONS.forEach((action: PredefinedAction) => {
      expect(action.id).toBeTruthy();
      expect(typeof action.id).toBe('string');
      expect(action.id.length).toBeGreaterThan(0);
    });
  });

  it('every action has a non-empty name', () => {
    PREDEFINED_ACTIONS.forEach((action: PredefinedAction) => {
      expect(action.name).toBeTruthy();
      expect(typeof action.name).toBe('string');
      expect(action.name.length).toBeGreaterThan(0);
    });
  });

  it('every action has co2Saved > 0', () => {
    PREDEFINED_ACTIONS.forEach((action: PredefinedAction) => {
      expect(action.co2Saved).toBeGreaterThan(0);
    });
  });

  it('every action has a valid category', () => {
    const validCategories = ['Transport', 'Diet', 'Energy', 'Shopping'];
    PREDEFINED_ACTIONS.forEach((action: PredefinedAction) => {
      expect(validCategories).toContain(action.category);
    });
  });

  it('all IDs are unique', () => {
    const ids = PREDEFINED_ACTIONS.map(a => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
