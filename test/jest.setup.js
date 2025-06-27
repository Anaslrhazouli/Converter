// Setup file for E2E tests
jest.setTimeout(30000);

beforeAll(async () => {
  // Wait for the server to be ready
  await page.goto('http://localhost:80', { waitUntil: 'networkidle0' });
});

beforeEach(async () => {
  // Reset to home page before each test
  await page.goto('http://localhost:80', { waitUntil: 'networkidle0' });
});
