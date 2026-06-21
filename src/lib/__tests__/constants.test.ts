import { TRANSPORT_OPTIONS, DIET_OPTIONS, ENERGY_OPTIONS } from '../constants';

describe('Constants', () => {
  it('TRANSPORT_OPTIONS has exactly 4 entries and includes Car (Gasoline)', () => {
    expect(TRANSPORT_OPTIONS.length).toBe(4);
    expect(TRANSPORT_OPTIONS).toContain('Car (Gasoline)');
  });

  it('DIET_OPTIONS has exactly 4 entries and includes Vegan', () => {
    expect(DIET_OPTIONS.length).toBe(4);
    expect(DIET_OPTIONS).toContain('Vegan');
  });

  it('ENERGY_OPTIONS has exactly 4 entries and includes 100% Renewable', () => {
    expect(ENERGY_OPTIONS.length).toBe(4);
    expect(ENERGY_OPTIONS).toContain('100% Renewable');
  });

});
