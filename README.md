# Convert API

A modern REST API for currency conversion, tax calculation, and discount calculation with a beautiful web interface.

## Features

- **Currency Conversion**: Convert between EUR, USD, and GBP with fixed exchange rates
- **Tax Calculation**: Calculate tax-inclusive prices (TVA)
- **Discount Calculation**: Calculate discounted prices
- **Modern Web Interface**: Clean, responsive frontend for testing the API
- **Comprehensive Tests**: Full Jest test suite with 13 passing tests

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

- 1 EUR = 1.1 USD
- 1 USD = 0.8 GBP
- Self-conversion rates = 1.0

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
npm test
```

### Open the web interface
Open `index.html` in your browser to access the modern web interface.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Testing**: Jest
- **CORS**: Enabled for browser compatibility

## Project Structure

```
convert/
├── convert.js          # Main API server
├── convert.test.js     # Jest test suite
├── index.html          # Web interface
├── package.json        # Dependencies
└── README.md          # Documentation
```

## Development

The API includes:
- Input validation (no negatives, unknown currencies)
- Error handling with descriptive messages
- CORS support for frontend integration
- Pure math functions for unit testing
- Modern ES6+ JavaScript

## License

MIT License
