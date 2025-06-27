# Convert API

[Live Demo](http://185.98.138.207/)

A modern REST API for currency conversion, tax calculation, and discount calculation with a beautiful web interface available online.

## Features

- **Currency Conversion**: Convert between EUR, USD, and GBP with fixed exchange rates
- **Tax Calculation**: Calculate tax-inclusive prices (TVA)
- **Discount Calculation**: Calculate discounted prices
- **Modern Web Interface**: Clean, responsive frontend for testing the API
- **Live Demo**: Available at [http://185.98.138.207/](http://185.98.138.207/)
- **Comprehensive Test Suite**: Full Jest test suite with 76+ passing tests and **95%+ code coverage**
  - **Unit Tests**: 13 tests for pure math functions
  - **Integration Tests**: 25 tests for API endpoints
  - **Functional Tests**: 14 tests for end-to-end workflows
  - **E2E Tests**: 24 tests for complete web application user interactions
- **Code Coverage**: Detailed coverage reports with HTML output

## API Endpoints

### Currency Conversion

```
GET /convert?from=EUR&to=USD&amount=100
```

Response:

```json
{
  "from": "EUR",
  "to": "USD",
  "originalAmount": 100,
  "convertedAmount": 110
}
```

### Tax Calculation

```
GET /tva?ht=100&taux=20
```

Response:

```json
{
  "ht": 100,
  "taux": 20,
  "ttc": 120
}
```

### Discount Calculation

```
GET /remise?prix=100&pourcentage=10
```

Response:

```json
{
  "prixInitial": 100,
  "pourcentage": 10,
  "prixFinal": 90
}
```

## Exchange Rates

* 1 EUR = 1.1 USD
* 1 USD = 0.8 GBP
* Self-conversion rates = 1.0

## Installation

```bash
npm install
```

## Usage

### Start the server

```bash
npm start
```

### Run tests

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests  
npm run test:integration

# Run only functional tests
npm run test:functional

# Run only E2E tests (requires server to be running)
npm run test:e2e

# Run all tests with verbose output
npm run test:all

# Run complete test suite (unit + integration + functional + E2E)
npm run test:complete

# Run tests with coverage
npm run test:coverage

# Run tests with coverage and verbose output
npm run test:coverage:all
```

### Open the web interface

Open [http://185.98.138.207/](http://185.98.138.207/) in your browser to access the modern web interface.

## Tech Stack

<<<<<<< Updated upstream
* **Backend**: Node.js, Express.js
* **Frontend**: Vanilla HTML/CSS/JavaScript
* **Testing**: Jest
* **CORS**: Enabled for browser compatibility
=======
- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Testing**: Jest with SuperTest for API testing and Puppeteer for E2E testing
- **CORS**: Enabled for browser compatibility
>>>>>>> Stashed changes

## Project Structure

```
convert/
├── convert.js                    # Main API server
├── test/                         # Test directory
│   ├── convert.test.js          # Unit & integration tests
│   ├── convert.functional.test.js # Functional tests
│   ├── convert.e2e.test.js      # End-to-end browser tests
│   ├── jest-puppeteer.config.js # Puppeteer configuration
│   └── jest.setup.js            # Test setup
├── jest.config.json             # Jest configuration
├── index.html                    # Web interface
├── package.json                  # Dependencies
├── coverage/                     # Coverage reports (generated)
└── README.md                    # Documentation
```

## Test Coverage

The project maintains excellent test coverage with detailed reporting:

### Coverage Statistics
- **Statements**: 95.16% (59/62)
- **Branches**: 95.91% (47/49) 
- **Functions**: 75% (6/8)
- **Lines**: 95.16% (59/62)

### Coverage Scripts
```bash
# Run tests with coverage report
npm run test:coverage

# Run tests with coverage and verbose output
npm run test:coverage:all

# Generate coverage report and open HTML view (Windows)
npm run test:coverage:open
```

### Coverage Reports
Coverage reports are generated in multiple formats:
- **Console**: Text summary in terminal
- **HTML**: Interactive report in `coverage/lcov-report/index.html`
- **LCOV**: For external tools in `coverage/lcov.info`
- **JSON**: Machine-readable format in `coverage/coverage-final.json`

The uncovered lines are primarily:
- Server startup code (excluded during tests)
- Static file serving routes
- Process environment checks

## Development

The API includes:

* Input validation (no negatives, unknown currencies)
* Error handling with descriptive messages
* CORS support for frontend integration
* Pure math functions for unit testing
* Modern ES6+ JavaScript

## License

MIT License
