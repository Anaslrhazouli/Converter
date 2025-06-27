const { convert, tva, remise } = require('../convert');
const request = require('supertest');
const { app } = require('../convert');

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

// Integration tests for REST API endpoints
describe('Integration Tests - API Endpoints', () => {
  describe('GET /convert', () => {
    test('should convert EUR to USD successfully', async () => {
      const response = await request(app)
        .get('/convert')
        .query({ from: 'EUR', to: 'USD', amount: 100 });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        from: 'EUR',
        to: 'USD',
        originalAmount: 100,
        convertedAmount: 110
      });
    });

    test('should convert USD to GBP successfully', async () => {
      const response = await request(app)
        .get('/convert')
        .query({ from: 'USD', to: 'GBP', amount: 100 });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        from: 'USD',
        to: 'GBP',
        originalAmount: 100,
        convertedAmount: 80
      });
    });

    test('should handle decimal amounts correctly', async () => {
      const response = await request(app)
        .get('/convert')
        .query({ from: 'EUR', to: 'USD', amount: 99.99 });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        from: 'EUR',
        to: 'USD',
        originalAmount: 99.99,
        convertedAmount: 109.99
      });
    });

    test('should return 400 for missing parameters', async () => {
      const response = await request(app)
        .get('/convert')
        .query({ from: 'EUR', to: 'USD' }); // missing amount
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Missing required parameters: from, to, amount'
      });
    });

    test('should return 400 for invalid amount', async () => {
      const response = await request(app)
        .get('/convert')
        .query({ from: 'EUR', to: 'USD', amount: 'invalid' });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Amount must be a valid number'
      });
    });

    test('should return 400 for negative amount', async () => {
      const response = await request(app)
        .get('/convert')
        .query({ from: 'EUR', to: 'USD', amount: -100 });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Amount cannot be negative'
      });
    });

    test('should return 400 for unsupported currency', async () => {
      const response = await request(app)
        .get('/convert')
        .query({ from: 'EUR', to: 'JPY', amount: 100 });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Conversion from EUR to JPY not supported'
      });
    });

    test('should return 400 for unsupported from currency', async () => {
      const response = await request(app)
        .get('/convert')
        .query({ from: 'JPY', to: 'USD', amount: 100 });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Unsupported currency: JPY'
      });
    });

    test('should handle case insensitive currencies', async () => {
      const response = await request(app)
        .get('/convert')
        .query({ from: 'eur', to: 'usd', amount: 100 });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        from: 'EUR',
        to: 'USD',
        originalAmount: 100,
        convertedAmount: 110
      });
    });
  });

  describe('GET /tva', () => {
    test('should calculate TVA correctly with 20% rate', async () => {
      const response = await request(app)
        .get('/tva')
        .query({ ht: 100, taux: 20 });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ht: 100,
        taux: 20,
        ttc: 120
      });
    });

    test('should calculate TVA correctly with 10% rate', async () => {
      const response = await request(app)
        .get('/tva')
        .query({ ht: 50, taux: 10 });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ht: 50,
        taux: 10,
        ttc: 55
      });
    });

    test('should handle decimal amounts', async () => {
      const response = await request(app)
        .get('/tva')
        .query({ ht: 99.99, taux: 20 });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ht: 99.99,
        taux: 20,
        ttc: 119.99
      });
    });

    test('should return 400 for missing parameters', async () => {
      const response = await request(app)
        .get('/tva')
        .query({ ht: 100 }); // missing taux
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Missing required parameters: ht, taux'
      });
    });

    test('should return 400 for invalid parameters', async () => {
      const response = await request(app)
        .get('/tva')
        .query({ ht: 'invalid', taux: 20 });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Parameters must be valid numbers'
      });
    });

    test('should return 400 for negative parameters', async () => {
      const response = await request(app)
        .get('/tva')
        .query({ ht: -100, taux: 20 });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Parameters cannot be negative'
      });
    });
  });

  describe('GET /remise', () => {
    test('should calculate 10% discount correctly', async () => {
      const response = await request(app)
        .get('/remise')
        .query({ prix: 100, pourcentage: 10 });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        prixInitial: 100,
        pourcentage: 10,
        prixFinal: 90
      });
    });

    test('should calculate 50% discount correctly', async () => {
      const response = await request(app)
        .get('/remise')
        .query({ prix: 200, pourcentage: 50 });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        prixInitial: 200,
        pourcentage: 50,
        prixFinal: 100
      });
    });

    test('should handle 0% discount', async () => {
      const response = await request(app)
        .get('/remise')
        .query({ prix: 100, pourcentage: 0 });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        prixInitial: 100,
        pourcentage: 0,
        prixFinal: 100
      });
    });

    test('should handle 100% discount', async () => {
      const response = await request(app)
        .get('/remise')
        .query({ prix: 100, pourcentage: 100 });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        prixInitial: 100,
        pourcentage: 100,
        prixFinal: 0
      });
    });

    test('should handle decimal prices', async () => {
      const response = await request(app)
        .get('/remise')
        .query({ prix: 99.99, pourcentage: 10 });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        prixInitial: 99.99,
        pourcentage: 10,
        prixFinal: 89.99
      });
    });

    test('should return 400 for missing parameters', async () => {
      const response = await request(app)
        .get('/remise')
        .query({ prix: 100 }); // missing pourcentage
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Missing required parameters: prix, pourcentage'
      });
    });

    test('should return 400 for invalid parameters', async () => {
      const response = await request(app)
        .get('/remise')
        .query({ prix: 'invalid', pourcentage: 10 });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Parameters must be valid numbers'
      });
    });

    test('should return 400 for negative parameters', async () => {
      const response = await request(app)
        .get('/remise')
        .query({ prix: -100, pourcentage: 10 });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Parameters cannot be negative'
      });
    });

    test('should return 400 for percentage over 100', async () => {
      const response = await request(app)
        .get('/remise')
        .query({ prix: 100, pourcentage: 150 });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Percentage cannot exceed 100'
      });
    });
  });

  describe('GET / (Root route)', () => {
    test('should serve the HTML interface', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.type).toBe('text/html');
    });
  });

  describe('404 Error handling', () => {
    test('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/nonexistent');
      
      expect(response.status).toBe(404);
    });
  });
});