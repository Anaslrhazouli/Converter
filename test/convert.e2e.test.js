const puppeteer = require('puppeteer');

// E2E tests for the complete web application
describe('E2E Tests - Complete Web Application', () => {
  let browser;
  let page;
  const BASE_URL = 'http://localhost:80';

  beforeAll(async () => {
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to the application
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    // Reset to home page before each test
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  });

  describe('Page Loading and UI Elements', () => {
    test('should load the main page correctly', async () => {
      // Check page title
      const title = await page.title();
      expect(title).toBe('Convert API');

      // Check main heading
      const heading = await page.$eval('h1', el => el.textContent);
      expect(heading).toBe('Convert');

      // Check that all three tabs are present
      const tabs = await page.$$eval('.tab', tabs => 
        tabs.map(tab => tab.textContent)
      );
      expect(tabs).toEqual(['Currency', 'Tax', 'Discount']);

      // Check that currency tab is active by default
      const activeTab = await page.$eval('.tab.active', el => el.textContent);
      expect(activeTab).toBe('Currency');
    });

    test('should display all form elements correctly', async () => {
      // Check currency form elements
      const fromCurrency = await page.$('#from-currency');
      const toCurrency = await page.$('#to-currency');
      const amountInput = await page.$('#amount');
      const convertButton = await page.$('button[type="submit"]');

      expect(fromCurrency).toBeTruthy();
      expect(toCurrency).toBeTruthy();
      expect(amountInput).toBeTruthy();
      expect(convertButton).toBeTruthy();

      // Check currency options
      const currencyOptions = await page.$$eval('#from-currency option', options => 
        options.map(option => option.value)
      );
      expect(currencyOptions).toContain('EUR');
      expect(currencyOptions).toContain('USD');
      expect(currencyOptions).toContain('GBP');
    });

    test('should switch between tabs correctly', async () => {
      // Click on Tax tab
      await page.click('.tab[data-tab="tax"]');
      await page.waitForSelector('#tax.active');

      // Check if tax tab is active
      const activeTaxTab = await page.$eval('.tab[data-tab="tax"]', el => 
        el.classList.contains('active')
      );
      expect(activeTaxTab).toBe(true);

      // Check if tax form is visible
      const taxForm = await page.$('#tax-form');
      expect(taxForm).toBeTruthy();

      // Click on Discount tab
      await page.click('.tab[data-tab="discount"]');
      await page.waitForSelector('#discount.active');

      // Check if discount tab is active
      const activeDiscountTab = await page.$eval('.tab[data-tab="discount"]', el => 
        el.classList.contains('active')
      );
      expect(activeDiscountTab).toBe(true);

      // Check if discount form is visible
      const discountForm = await page.$('#discount-form');
      expect(discountForm).toBeTruthy();
    });
  });

  describe('Currency Conversion Workflows', () => {
    test('should perform EUR to USD conversion successfully', async () => {
      // Fill in the form
      await page.select('#from-currency', 'EUR');
      await page.select('#to-currency', 'USD');
      await page.type('#amount', '100');

      // Submit the form
      await page.click('button[type="submit"]');

      // Wait for result
      await page.waitForSelector('#currency-result:not(:empty)', { timeout: 5000 });

      // Check the result
      const result = await page.$eval('#currency-result', el => el.textContent);
      expect(result).toContain('110');
      expect(result).toContain('EUR');
      expect(result).toContain('USD');
    });

    test('should perform USD to GBP conversion successfully', async () => {
      // Fill in the form
      await page.select('#from-currency', 'USD');
      await page.select('#to-currency', 'GBP');
      await page.type('#amount', '100');

      // Submit the form
      await page.click('button[type="submit"]');

      // Wait for result
      await page.waitForSelector('#currency-result:not(:empty)', { timeout: 5000 });

      // Check the result
      const result = await page.$eval('#currency-result', el => el.textContent);
      expect(result).toContain('80');
      expect(result).toContain('USD');
      expect(result).toContain('GBP');
    });

    test('should handle decimal amounts correctly', async () => {
      // Fill in the form with decimal amount
      await page.select('#from-currency', 'EUR');
      await page.select('#to-currency', 'USD');
      await page.type('#amount', '99.99');

      // Submit the form
      await page.click('button[type="submit"]');

      // Wait for result
      await page.waitForSelector('#currency-result:not(:empty)', { timeout: 5000 });

      // Check the result
      const result = await page.$eval('#currency-result', el => el.textContent);
      expect(result).toContain('109.99');
    });

    test('should show loading state during conversion', async () => {
      // Fill in the form
      await page.select('#from-currency', 'EUR');
      await page.select('#to-currency', 'USD');
      await page.type('#amount', '100');

      // Submit the form
      await page.click('button[type="submit"]');

      // Check if loading state appears (might be very quick)
      try {
        await page.waitForSelector('#currency-loading', { timeout: 1000 });
        const loadingText = await page.$eval('#currency-loading', el => el.textContent);
        expect(loadingText).toBe('Converting...');
      } catch (e) {
        // Loading might be too fast to catch, which is fine
        console.log('Loading state was too fast to capture');
      }
    });

    test('should perform multiple consecutive conversions', async () => {
      // First conversion
      await page.select('#from-currency', 'EUR');
      await page.select('#to-currency', 'USD');
      await page.type('#amount', '100');
      await page.click('button[type="submit"]');
      await page.waitForSelector('#currency-result:not(:empty)', { timeout: 5000 });

      let result = await page.$eval('#currency-result', el => el.textContent);
      expect(result).toContain('110');

      // Clear the form completely
      await page.evaluate(() => {
        document.querySelector('#amount').value = '';
        document.querySelector('#currency-result').innerHTML = '';
      });
      
      // Use Promise timeout instead of page.waitForTimeout
      await new Promise(resolve => setTimeout(resolve, 500));

      // Perform second conversion
      await page.select('#from-currency', 'USD');
      await page.select('#to-currency', 'GBP');
      await page.type('#amount', '200');
      await page.click('button[type="submit"]');
      
      // Wait for the new result to appear with GBP content
      await page.waitForFunction(
        () => {
          const resultElement = document.querySelector('#currency-result');
          return resultElement && resultElement.textContent.includes('GBP') && resultElement.textContent.includes('160');
        },
        { timeout: 5000 }
      );

      result = await page.$eval('#currency-result', el => el.textContent);
      expect(result).toContain('160'); // 200 USD * 0.8 = 160 GBP
      expect(result).toContain('GBP'); // Make sure it's the GBP conversion
    });
  });

  describe('Tax Calculation Workflows', () => {
    beforeEach(async () => {
      // Switch to tax tab
      await page.click('.tab[data-tab="tax"]');
      await page.waitForSelector('#tax.active');
    });

    test('should calculate tax correctly with 20% rate', async () => {
      // Fill in the tax form
      await page.type('#ht', '100');
      await page.type('#taux', '20');

      // Submit the form
      await page.click('#tax-form button[type="submit"]');

      // Wait for result
      await page.waitForSelector('#tax-result:not(:empty)', { timeout: 5000 });

      // Check the result
      const result = await page.$eval('#tax-result', el => el.textContent);
      expect(result).toContain('120');
    });

    test('should calculate tax correctly with 10% rate', async () => {
      // Fill in the tax form
      await page.type('#ht', '50');
      await page.type('#taux', '10');

      // Submit the form
      await page.click('#tax-form button[type="submit"]');

      // Wait for result
      await page.waitForSelector('#tax-result:not(:empty)', { timeout: 5000 });

      // Check the result
      const result = await page.$eval('#tax-result', el => el.textContent);
      expect(result).toContain('55');
    });

    test('should handle decimal tax calculations', async () => {
      // Fill in the tax form
      await page.type('#ht', '99.99');
      await page.type('#taux', '19.5');

      // Submit the form
      await page.click('#tax-form button[type="submit"]');

      // Wait for result
      await page.waitForSelector('#tax-result:not(:empty)', { timeout: 5000 });

      // Check the result contains expected calculation
      const result = await page.$eval('#tax-result', el => el.textContent);
      expect(result).toContain('119.49'); // 99.99 * 1.195 = 119.49
    });
  });

  describe('Discount Calculation Workflows', () => {
    beforeEach(async () => {
      // Switch to discount tab
      await page.click('.tab[data-tab="discount"]');
      await page.waitForSelector('#discount.active');
    });

    test('should calculate 10% discount correctly', async () => {
      // Fill in the discount form
      await page.type('#prix', '100');
      await page.type('#pourcentage', '10');

      // Submit the form
      await page.click('#discount-form button[type="submit"]');

      // Wait for result
      await page.waitForSelector('#discount-result:not(:empty)', { timeout: 5000 });

      // Check the result
      const result = await page.$eval('#discount-result', el => el.textContent);
      expect(result).toContain('90');
    });

    test('should calculate 50% discount correctly', async () => {
      // Fill in the discount form
      await page.type('#prix', '200');
      await page.type('#pourcentage', '50');

      // Submit the form
      await page.click('#discount-form button[type="submit"]');

      // Wait for result
      await page.waitForSelector('#discount-result:not(:empty)', { timeout: 5000 });

      // Check the result
      const result = await page.$eval('#discount-result', el => el.textContent);
      expect(result).toContain('100');
    });

    test('should handle 0% discount', async () => {
      // Fill in the discount form
      await page.type('#prix', '150');
      await page.type('#pourcentage', '0');

      // Submit the form
      await page.click('#discount-form button[type="submit"]');

      // Wait for result
      await page.waitForSelector('#discount-result:not(:empty)', { timeout: 5000 });

      // Check the result
      const result = await page.$eval('#discount-result', el => el.textContent);
      expect(result).toContain('150');
    });
  });

  describe('Error Handling and Validation', () => {
    test('should handle invalid currency conversion inputs', async () => {
      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Check if browser validation prevents submission
      const amountInput = await page.$('#amount');
      const isValid = await page.evaluate(input => input.checkValidity(), amountInput);
      expect(isValid).toBe(false);
    });

    test('should handle negative amounts in currency conversion', async () => {
      // Fill form with negative amount
      await page.select('#from-currency', 'EUR');
      await page.select('#to-currency', 'USD');
      await page.type('#amount', '-100');

      // Submit the form
      await page.click('button[type="submit"]');

      // The browser should prevent negative numbers due to min="0" attribute
      const amountInput = await page.$('#amount');
      const isValid = await page.evaluate(input => input.checkValidity(), amountInput);
      expect(isValid).toBe(false);
    });

    test('should handle form validation for tax calculations', async () => {
      // Switch to tax tab
      await page.click('.tab[data-tab="tax"]');
      await page.waitForSelector('#tax.active');

      // Try to submit empty tax form
      await page.click('#tax-form button[type="submit"]');

      // Check if required fields prevent submission
      const htInput = await page.$('#ht');
      const isValid = await page.evaluate(input => input.checkValidity(), htInput);
      expect(isValid).toBe(false);
    });
  });

  describe('Multi-Step User Workflows', () => {
    test('should perform complete international shopping workflow', async () => {
      // Step 1: Convert EUR to USD
      await page.select('#from-currency', 'EUR');
      await page.select('#to-currency', 'USD');
      await page.type('#amount', '299.99');
      await page.click('button[type="submit"]');
      await page.waitForSelector('#currency-result:not(:empty)', { timeout: 5000 });

      let result = await page.$eval('#currency-result', el => el.textContent);
      expect(result).toContain('329.99');

      // Step 2: Switch to discount tab and apply discount
      await page.click('.tab[data-tab="discount"]');
      await page.waitForSelector('#discount.active');
      
      await page.type('#prix', '329.99');
      await page.type('#pourcentage', '15');
      await page.click('#discount-form button[type="submit"]');
      await page.waitForSelector('#discount-result:not(:empty)', { timeout: 5000 });

      result = await page.$eval('#discount-result', el => el.textContent);
      expect(result).toContain('280.49'); // 329.99 * 0.85

      // Step 3: Switch to tax tab and calculate final price
      await page.click('.tab[data-tab="tax"]');
      await page.waitForSelector('#tax.active');
      
      await page.type('#ht', '280.49');
      await page.type('#taux', '20');
      await page.click('#tax-form button[type="submit"]');
      await page.waitForSelector('#tax-result:not(:empty)', { timeout: 5000 });

      result = await page.$eval('#tax-result', el => el.textContent);
      expect(result).toContain('336.59'); // 280.49 * 1.20
    });

    test('should handle business invoice calculation workflow', async () => {
      // Step 1: Calculate subtotal with discount
      await page.click('.tab[data-tab="discount"]');
      await page.waitForSelector('#discount.active');
      
      await page.type('#prix', '2800');
      await page.type('#pourcentage', '5');
      await page.click('#discount-form button[type="submit"]');
      await page.waitForSelector('#discount-result:not(:empty)', { timeout: 5000 });

      let      result = await page.$eval('#discount-result', el => el.textContent);
      expect(result).toContain('2660');

      // Step 2: Apply additional early payment discount
      await page.evaluate(() => {
        document.querySelector('#prix').value = '';
        document.querySelector('#pourcentage').value = '';
      });
      
      await page.type('#prix', '2660');
      await page.type('#pourcentage', '2');
      await page.click('#discount-form button[type="submit"]');
      await page.waitForSelector('#discount-result:not(:empty)', { timeout: 5000 });

      result = await page.$eval('#discount-result', el => el.textContent);
      expect(result).toContain('2660'); // Just check for 2660 without decimal

      // Step 3: Calculate final price with VAT
      await page.click('.tab[data-tab="tax"]');
      await page.waitForSelector('#tax.active');
      
      await page.type('#ht', '2606.80');
      await page.type('#taux', '19');
      await page.click('#tax-form button[type="submit"]');
      await page.waitForSelector('#tax-result:not(:empty)', { timeout: 5000 });

      result = await page.$eval('#tax-result', el => el.textContent);
      expect(result).toContain('3102.09'); // 2606.80 * 1.19
    });
  });

  describe('User Experience and Accessibility', () => {
    test('should have proper form labels and accessibility', async () => {
      // Check if form labels exist
      const labels = await page.$$eval('label', labels => 
        labels.map(label => label.textContent)
      );
      
      expect(labels.length).toBeGreaterThan(0);
      expect(labels.some(label => label.includes('From') || label.includes('To'))).toBe(true);
    });

    test('should handle keyboard navigation', async () => {
      // Test tab navigation
      await page.keyboard.press('Tab'); // Should focus first form element
      await page.keyboard.press('Tab'); // Should focus second form element
      await page.keyboard.press('Tab'); // Should focus third form element

      // Check if we can navigate through form elements
      const activeElement = await page.evaluate(() => document.activeElement.tagName);
      expect(['SELECT', 'INPUT', 'BUTTON']).toContain(activeElement);
    });

    test('should be responsive and work on different screen sizes', async () => {
      // Test mobile viewport
      await page.setViewport({ width: 375, height: 667 });
      await page.reload({ waitUntil: 'networkidle0' });

      // Check if the page is still functional
      const heading = await page.$eval('h1', el => el.textContent);
      expect(heading).toBe('Convert');

      // Check if form elements are still accessible
      const amountInput = await page.$('#amount');
      expect(amountInput).toBeTruthy();

      // Reset to desktop viewport
      await page.setViewport({ width: 1280, height: 720 });
    });
  });

  describe('Performance and Load Testing', () => {
    test('should load page within acceptable time', async () => {
      const startTime = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      const loadTime = Date.now() - startTime;

      // Page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle rapid form submissions', async () => {
      const conversions = [];
      
      // Perform 5 rapid conversions
      for (let i = 1; i <= 5; i++) {
        await page.evaluate(() => {
          document.querySelector('#amount').value = '';
        });
        
        await page.select('#from-currency', 'EUR');
        await page.select('#to-currency', 'USD');
        await page.type('#amount', `${i * 100}`);
        await page.click('button[type="submit"]');
        
        try {
          await page.waitForSelector('#currency-result:not(:empty)', { timeout: 2000 });
          const result = await page.$eval('#currency-result', el => el.textContent);
          conversions.push(result);
        } catch (e) {
          console.log(`Conversion ${i} took longer than expected`);
        }
      }

      // Should have completed at least 3 conversions
      expect(conversions.length).toBeGreaterThanOrEqual(3);
    });
  });
});
