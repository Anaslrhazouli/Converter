const request = require('supertest');
const { app } = require('../convert');

// Functional tests for complete user workflows
describe('Functional Tests - End-to-End User Scenarios', () => {
  
  describe('Currency Conversion Workflows', () => {
    test('should handle complete currency conversion workflow', async () => {
      // User converts 1000 EUR to USD
      const response1 = await request(app)
        .get('/convert')
        .query({ from: 'EUR', to: 'USD', amount: 1000 });
      
      expect(response1.status).toBe(200);
      expect(response1.body.convertedAmount).toBe(1100);
      
      // User then converts the USD result back to EUR
      const usdAmount = response1.body.convertedAmount;
      const response2 = await request(app)
        .get('/convert')
        .query({ from: 'USD', to: 'EUR', amount: usdAmount });
      
      expect(response2.status).toBe(200);
      // Should be close to original amount (within rounding tolerance)
      expect(Math.abs(response2.body.convertedAmount - 1000)).toBeLessThan(1);
    });

    test('should handle multi-step currency conversion chain', async () => {
      // EUR → USD → GBP conversion chain
      const initialAmount = 500;
      
      // Step 1: EUR to USD
      const eurToUsd = await request(app)
        .get('/convert')
        .query({ from: 'EUR', to: 'USD', amount: initialAmount });
      
      expect(eurToUsd.status).toBe(200);
      const usdAmount = eurToUsd.body.convertedAmount;
      
      // Step 2: USD to GBP
      const usdToGbp = await request(app)
        .get('/convert')
        .query({ from: 'USD', to: 'GBP', amount: usdAmount });
      
      expect(usdToGbp.status).toBe(200);
      const finalGbpAmount = usdToGbp.body.convertedAmount;
      
      // Verify the conversion chain
      expect(finalGbpAmount).toBe(440); // 500 * 1.1 * 0.8 = 440
    });

    test('should handle large volume conversion requests', async () => {
      const requests = [];
      const amounts = [100, 500, 1000, 2500, 5000];
      
      // Create multiple simultaneous conversion requests
      for (const amount of amounts) {
        requests.push(
          request(app)
            .get('/convert')
            .query({ from: 'EUR', to: 'USD', amount })
        );
      }
      
      const responses = await Promise.all(requests);
      
      // Verify all requests succeeded
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.convertedAmount).toBeCloseTo(amounts[index] * 1.1, 2);
      });
    });
  });

  describe('Tax Calculation Workflows', () => {
    test('should handle complete tax calculation workflow for invoice', async () => {
      const items = [
        { price: 100, taxRate: 20 }, // Product 1
        { price: 250, taxRate: 10 }, // Product 2
        { price: 75, taxRate: 20 }   // Product 3
      ];
      
      const taxCalculations = [];
      
      // Calculate tax for each item
      for (const item of items) {
        const response = await request(app)
          .get('/tva')
          .query({ ht: item.price, taux: item.taxRate });
        
        expect(response.status).toBe(200);
        taxCalculations.push(response.body);
      }
      
      // Verify individual calculations
      expect(taxCalculations[0].ttc).toBe(120); // 100 + 20% = 120
      expect(taxCalculations[1].ttc).toBe(275); // 250 + 10% = 275
      expect(taxCalculations[2].ttc).toBe(90);  // 75 + 20% = 90
      
      // Calculate total invoice
      const totalHT = taxCalculations.reduce((sum, calc) => sum + calc.ht, 0);
      const totalTTC = taxCalculations.reduce((sum, calc) => sum + calc.ttc, 0);
      
      expect(totalHT).toBe(425);  // 100 + 250 + 75
      expect(totalTTC).toBe(485); // 120 + 275 + 90
    });

    test('should handle different tax rates for different regions', async () => {
      const products = [
        { name: 'Standard Product', price: 100 },
        { name: 'Luxury Item', price: 500 },
        { name: 'Essential Good', price: 50 }
      ];
      
      const regions = [
        { name: 'France', rate: 20 },
        { name: 'Germany', rate: 19 },
        { name: 'UK', rate: 17.5 }
      ];
      
      const calculations = [];
      
      // Calculate tax for each product in each region
      for (const product of products) {
        for (const region of regions) {
          const response = await request(app)
            .get('/tva')
            .query({ ht: product.price, taux: region.rate });
          
          expect(response.status).toBe(200);
          calculations.push({
            product: product.name,
            region: region.name,
            ...response.body
          });
        }
      }
      
      // Verify we have calculations for all combinations
      expect(calculations).toHaveLength(9); // 3 products × 3 regions
      
      // Verify specific calculations
      const franceStandard = calculations.find(c => 
        c.product === 'Standard Product' && c.region === 'France'
      );
      expect(franceStandard.ttc).toBe(120);
    });
  });

  describe('Discount Application Workflows', () => {
    test('should handle complete e-commerce discount workflow', async () => {
      const cartItems = [
        { name: 'Item 1', price: 99.99 },
        { name: 'Item 2', price: 149.99 },
        { name: 'Item 3', price: 79.99 }
      ];
      
      // Calculate subtotal
      const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
      expect(subtotal).toBe(329.97);
      
      // Apply different discount scenarios
      const discountScenarios = [
        { type: 'Member Discount', percentage: 10 },
        { type: 'Seasonal Sale', percentage: 25 },
        { type: 'Loyalty Reward', percentage: 15 }
      ];
      
      const discountResults = [];
      
      for (const scenario of discountScenarios) {
        const response = await request(app)
          .get('/remise')
          .query({ prix: subtotal, pourcentage: scenario.percentage });
        
        expect(response.status).toBe(200);
        discountResults.push({
          type: scenario.type,
          ...response.body
        });
      }
      
      // Verify discount calculations
      expect(discountResults[0].prixFinal).toBe(296.97); // 10% off
      expect(discountResults[1].prixFinal).toBe(247.48); // 25% off
      expect(discountResults[2].prixFinal).toBe(280.47); // 15% off
    });

    test('should handle stacked discount workflow', async () => {
      const originalPrice = 1000;
      
      // Apply first discount (20% off)
      const firstDiscount = await request(app)
        .get('/remise')
        .query({ prix: originalPrice, pourcentage: 20 });
      
      expect(firstDiscount.status).toBe(200);
      const priceAfterFirst = firstDiscount.body.prixFinal;
      expect(priceAfterFirst).toBe(800);
      
      // Apply second discount (10% off the discounted price)
      const secondDiscount = await request(app)
        .get('/remise')
        .query({ prix: priceAfterFirst, pourcentage: 10 });
      
      expect(secondDiscount.status).toBe(200);
      const finalPrice = secondDiscount.body.prixFinal;
      expect(finalPrice).toBe(720); // 1000 * 0.8 * 0.9 = 720
      
      // Verify total discount is 28% (not 30%)
      const totalDiscountPercentage = ((originalPrice - finalPrice) / originalPrice) * 100;
      expect(totalDiscountPercentage).toBeCloseTo(28, 1);
    });

    test('should handle bulk discount tiers', async () => {
      const quantities = [1, 5, 10, 25, 50, 100];
      const unitPrice = 50;
      
      // Define discount tiers
      const getDiscountRate = (qty) => {
        if (qty >= 100) return 25;
        if (qty >= 50) return 20;
        if (qty >= 25) return 15;
        if (qty >= 10) return 10;
        if (qty >= 5) return 5;
        return 0;
      };
      
      const bulkPricing = [];
      
      for (const qty of quantities) {
        const totalPrice = qty * unitPrice;
        const discountRate = getDiscountRate(qty);
        
        const response = await request(app)
          .get('/remise')
          .query({ prix: totalPrice, pourcentage: discountRate });
        
        expect(response.status).toBe(200);
        bulkPricing.push({
          quantity: qty,
          totalPrice,
          discountRate,
          finalPrice: response.body.prixFinal,
          pricePerUnit: response.body.prixFinal / qty
        });
      }
      
      // Verify bulk discounts are applied correctly
      expect(bulkPricing[0].pricePerUnit).toBe(50);    // No discount
      expect(bulkPricing[1].pricePerUnit).toBe(47.5);  // 5% off
      expect(bulkPricing[2].pricePerUnit).toBe(45);    // 10% off
      expect(bulkPricing[3].pricePerUnit).toBe(42.5);  // 15% off
      expect(bulkPricing[4].pricePerUnit).toBe(40);    // 20% off
      expect(bulkPricing[5].pricePerUnit).toBe(37.5);  // 25% off
    });
  });

  describe('Combined Business Workflows', () => {
    test('should handle complete international e-commerce transaction', async () => {
      // Scenario: Customer in UK buying from French store
      const productPriceEUR = 299.99;
      
      // Step 1: Convert price to customer currency (GBP)
      // First convert EUR to USD, then USD to GBP (multi-hop conversion)
      const eurToUsd = await request(app)
        .get('/convert')
        .query({ from: 'EUR', to: 'USD', amount: productPriceEUR });
      
      expect(eurToUsd.status).toBe(200);
      const usdPrice = eurToUsd.body.convertedAmount;
      
      const usdToGbp = await request(app)
        .get('/convert')
        .query({ from: 'USD', to: 'GBP', amount: usdPrice });
      
      expect(usdToGbp.status).toBe(200);
      const gbpPrice = usdToGbp.body.convertedAmount;
      
      // Step 2: Apply promotional discount (15% off)
      const discountResponse = await request(app)
        .get('/remise')
        .query({ prix: gbpPrice, pourcentage: 15 });
      
      expect(discountResponse.status).toBe(200);
      const discountedPrice = discountResponse.body.prixFinal;
      
      // Step 3: Calculate VAT (20% UK rate)
      const vatResponse = await request(app)
        .get('/tva')
        .query({ ht: discountedPrice, taux: 20 });
      
      expect(vatResponse.status).toBe(200);
      const finalPrice = vatResponse.body.ttc;
      
      // Verify the complete transaction
      expect(usdPrice).toBe(329.99);           // 299.99 * 1.1
      expect(gbpPrice).toBe(263.99);           // 329.99 * 0.8
      expect(discountedPrice).toBe(224.39);    // 263.99 * 0.85
      expect(finalPrice).toBe(269.27);         // 224.39 * 1.2
      
      // Log the complete transaction flow
      console.log('International E-commerce Transaction:');
      console.log(`Original price (EUR): €${productPriceEUR}`);
      console.log(`Converted to GBP: £${gbpPrice}`);
      console.log(`After 15% discount: £${discountedPrice}`);
      console.log(`Final price with VAT: £${finalPrice}`);
    });

    test('should handle business invoice calculation workflow', async () => {
      // Scenario: Business invoice with multiple items, discounts, and taxes
      const invoiceItems = [
        { description: 'Consulting Services', amount: 2000, hours: 40, rate: 50 },
        { description: 'Software License', amount: 500, quantity: 1 },
        { description: 'Training Materials', amount: 300, quantity: 10, unitPrice: 30 }
      ];
      
      const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
      expect(subtotal).toBe(2800);
      
      // Apply volume discount (5% for orders over 2500)
      const volumeDiscount = await request(app)
        .get('/remise')
        .query({ prix: subtotal, pourcentage: 5 });
      
      expect(volumeDiscount.status).toBe(200);
      const afterVolumeDiscount = volumeDiscount.body.prixFinal;
      
      // Apply early payment discount (2% for payment within 10 days)
      const earlyPaymentDiscount = await request(app)
        .get('/remise')
        .query({ prix: afterVolumeDiscount, pourcentage: 2 });
      
      expect(earlyPaymentDiscount.status).toBe(200);
      const netAmount = earlyPaymentDiscount.body.prixFinal;
      
      // Calculate VAT (19% business rate)
      const vatCalculation = await request(app)
        .get('/tva')
        .query({ ht: netAmount, taux: 19 });
      
      expect(vatCalculation.status).toBe(200);
      const totalWithVat = vatCalculation.body.ttc;
      
      // Verify business invoice totals
      expect(afterVolumeDiscount).toBe(2660);     // 2800 * 0.95
      expect(netAmount).toBe(2606.8);             // 2660 * 0.98
      expect(totalWithVat).toBe(3102.09);         // 2606.8 * 1.19
      
      // Calculate total discount percentage
      const totalDiscountAmount = subtotal - netAmount;
      const totalDiscountPercentage = (totalDiscountAmount / subtotal) * 100;
      expect(Math.round(totalDiscountPercentage * 100) / 100).toBe(6.9); // ~6.9% total discount
    });

    test('should handle currency arbitrage workflow', async () => {
      // Scenario: Check for arbitrage opportunities across currency pairs
      const baseAmount = 1000;
      
      // Direct conversion: EUR → GBP
      const directEurGbp = await request(app)
        .get('/convert')
        .query({ from: 'EUR', to: 'USD', amount: baseAmount });
      expect(directEurGbp.status).toBe(200);
      
      const usdFromEur = directEurGbp.body.convertedAmount;
      
      const usdToGbp = await request(app)
        .get('/convert')
        .query({ from: 'USD', to: 'GBP', amount: usdFromEur });
      expect(usdToGbp.status).toBe(200);
      
      const finalGbp = usdToGbp.body.convertedAmount;
      
      // Reverse conversion: GBP → EUR (via USD)
      const gbpToUsd = await request(app)
        .get('/convert')
        .query({ from: 'GBP', to: 'USD', amount: finalGbp });
      expect(gbpToUsd.status).toBe(200);
      
      const usdFromGbp = gbpToUsd.body.convertedAmount;
      
      const usdToEur = await request(app)
        .get('/convert')
        .query({ from: 'USD', to: 'EUR', amount: usdFromGbp });
      expect(usdToEur.status).toBe(200);
      
      const backToEur = usdToEur.body.convertedAmount;
      
      // Check for arbitrage (should be close to original amount)
      const difference = Math.abs(baseAmount - backToEur);
      expect(difference).toBeLessThan(1); // Within rounding tolerance
      
      console.log('Arbitrage Check:');
      console.log(`Started with: €${baseAmount}`);
      console.log(`EUR→USD→GBP→USD→EUR: €${backToEur}`);
      console.log(`Difference: €${difference}`);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle graceful degradation when services are unavailable', async () => {
      // Test with extreme values that might cause issues
      const extremeValues = [0.01, 999999.99, 0];
      
      for (const value of extremeValues) {
        const convertResponse = await request(app)
          .get('/convert')
          .query({ from: 'EUR', to: 'USD', amount: value });
        
        expect(convertResponse.status).toBe(200);
        expect(convertResponse.body.convertedAmount).toBeCloseTo(value * 1.1, 2);
      }
    });

    test('should handle malformed requests gracefully', async () => {
      const malformedRequests = [
        { endpoint: '/convert', query: { from: '', to: 'USD', amount: 100 } },
        { endpoint: '/tva', query: { ht: '', taux: 20 } },
        { endpoint: '/remise', query: { prix: 100, pourcentage: '' } }
      ];
      
      for (const req of malformedRequests) {
        const response = await request(app)
          .get(req.endpoint)
          .query(req.query);
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();
      const concurrentRequests = 20;
      const requests = [];
      
      // Create multiple concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app)
            .get('/convert')
            .query({ from: 'EUR', to: 'USD', amount: 100 + i })
        );
      }
      
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Verify all requests completed successfully
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.convertedAmount).toBeCloseTo((100 + index) * 1.1, 2);
      });
      
      // Performance assertion (should complete within reasonable time)
      expect(duration).toBeLessThan(5000); // 5 seconds
      
      console.log(`${concurrentRequests} concurrent requests completed in ${duration}ms`);
    });
  });
});
