const { convert, tva, remise } = require('./convert');

// Unit tests for pure math functions
describe('Currency Conversion', () => {
  test('converts EUR to USD correctly', () => {
    expect(convert(100, 'EUR', 'USD')).toBe(110);
  });

  test('converts USD to GBP correctly', () => {
    expect(convert(100, 'USD', 'GBP')).toBe(80);
  });

  test('converts same currency to same currency', () => {
    expect(convert(100, 'EUR', 'EUR')).toBe(100);
    expect(convert(100, 'USD', 'USD')).toBe(100);
  });

  test('throws error for unsupported currency conversion', () => {
    expect(() => convert(100, 'EUR', 'JPY')).toThrow('Conversion from EUR to JPY not supported');
    expect(() => convert(100, 'XYZ', 'USD')).toThrow('Conversion from XYZ to USD not supported');
  });
});

describe('TVA Calculation', () => {
  test('calculates TVA correctly with 20% rate', () => {
    expect(tva(100, 20)).toBe(120);
  });

  test('calculates TVA correctly with 10% rate', () => {
    expect(tva(50, 10)).toBe(55);
  });

  test('handles 0% tax rate', () => {
    expect(tva(100, 0)).toBe(100);
  });

  test('handles decimal amounts', () => {
    expect(tva(99.99, 20)).toBe(119.99);
  });
});

describe('Remise Calculation', () => {
  test('calculates 10% discount correctly', () => {
    expect(remise(100, 10)).toBe(90);
  });

  test('calculates 50% discount correctly', () => {
    expect(remise(200, 50)).toBe(100);
  });

  test('handles 0% discount', () => {
    expect(remise(100, 0)).toBe(100);
  });

  test('handles 100% discount', () => {
    expect(remise(100, 100)).toBe(0);
  });

  test('handles decimal prices', () => {
    expect(remise(99.99, 10)).toBe(89.99);
  });
});