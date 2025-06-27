// REST API `GET /convert?from=EUR&to=USD&amount=100` → `{ "from": "EUR", "to": "USD", "originalAmount": 100, "convertedAmount": 110 }`

const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files (like index.html)
app.use(express.static(__dirname));

// Root route - serve the HTML interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Pure math functions for unit testing
function convert(amount, fromCurrency, toCurrency) {
  if (!EXCHANGE_RATES[fromCurrency] || !EXCHANGE_RATES[fromCurrency][toCurrency]) {
    throw new Error(`Conversion from ${fromCurrency} to ${toCurrency} not supported`);
  }
  const rate = EXCHANGE_RATES[fromCurrency][toCurrency];
  return Math.round(amount * rate * 100) / 100;
}

function tva(ht, taux) {
  return Math.round((ht + (ht * taux / 100)) * 100) / 100;
}

function remise(prix, pourcentage) {
  return Math.round((prix - (prix * pourcentage / 100)) * 100) / 100;
}

// Sample exchange rates (in a real app, you'd fetch from an external API)
const EXCHANGE_RATES = {
  'EUR': {
    'USD': 1.1,
    'EUR': 1.0
  },
  'USD': {
    'GBP': 0.8,
    'USD': 1.0,
    'EUR': 1 / 1.1  // Inverse of EUR to USD
  },
  'GBP': {
    'GBP': 1.0,
    'USD': 1 / 0.8  // Inverse of USD to GBP
  }
};

// GET /convert endpoint
app.get('/convert', (req, res) => {
  const { from, to, amount } = req.query;
  
  // Validate required parameters
  if (!from || !to || !amount) {
    return res.status(400).json({
      error: 'Missing required parameters: from, to, amount'
    });
  }
  
  // Validate amount is a number
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) {
    return res.status(400).json({
      error: 'Amount must be a valid number'
    });
  }
  
  // Validate amount is not negative
  if (numAmount < 0) {
    return res.status(400).json({
      error: 'Amount cannot be negative'
    });
  }
  
  // Validate currencies exist
  if (!EXCHANGE_RATES[from.toUpperCase()]) {
    return res.status(400).json({
      error: `Unsupported currency: ${from}`
    });
  }
  
  if (!EXCHANGE_RATES[from.toUpperCase()][to.toUpperCase()]) {
    return res.status(400).json({
      error: `Conversion from ${from} to ${to} not supported`
    });
  }
  
  // Perform conversion
  const rate = EXCHANGE_RATES[from.toUpperCase()][to.toUpperCase()];
  const convertedAmount = numAmount * rate;
  
  // Return response
  res.json({
    from: from.toUpperCase(),
    to: to.toUpperCase(),
    originalAmount: numAmount,
    convertedAmount: Math.round(convertedAmount * 100) / 100 // Round to 2 decimal places
  });
});

// GET /tva endpoint
app.get('/tva', (req, res) => {
  const { ht, taux } = req.query;
  
  // Validate required parameters
  if (!ht || !taux) {
    return res.status(400).json({
      error: 'Missing required parameters: ht, taux'
    });
  }
  
  // Validate inputs are numbers
  const numHt = parseFloat(ht);
  const numTaux = parseFloat(taux);
  
  if (isNaN(numHt) || isNaN(numTaux)) {
    return res.status(400).json({
      error: 'Parameters must be valid numbers'
    });
  }
  
  // Validate no negative values
  if (numHt < 0 || numTaux < 0) {
    return res.status(400).json({
      error: 'Parameters cannot be negative'
    });
  }
  
  // Calculate TTC (Tax Included)
  const ttc = numHt + (numHt * numTaux / 100);
  
  // Return response
  res.json({
    ht: numHt,
    taux: numTaux,
    ttc: Math.round(ttc * 100) / 100
  });
});

// GET /remise endpoint
app.get('/remise', (req, res) => {
  const { prix, pourcentage } = req.query;
  
  // Validate required parameters
  if (!prix || !pourcentage) {
    return res.status(400).json({
      error: 'Missing required parameters: prix, pourcentage'
    });
  }
  
  // Validate inputs are numbers
  const numPrix = parseFloat(prix);
  const numPourcentage = parseFloat(pourcentage);
  
  if (isNaN(numPrix) || isNaN(numPourcentage)) {
    return res.status(400).json({
      error: 'Parameters must be valid numbers'
    });
  }
  
  // Validate no negative values
  if (numPrix < 0 || numPourcentage < 0) {
    return res.status(400).json({
      error: 'Parameters cannot be negative'
    });
  }
  
  // Validate percentage doesn't exceed 100%
  if (numPourcentage > 100) {
    return res.status(400).json({
      error: 'Percentage cannot exceed 100'
    });
  }
  
  // Calculate final price after discount
  const prixFinal = numPrix - (numPrix * numPourcentage / 100);
  
  // Return response
  res.json({
    prixInitial: numPrix,
    pourcentage: numPourcentage,
    prixFinal: Math.round(prixFinal * 100) / 100
  });
});

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`Currency conversion API running on port ${PORT}`);
  });
}

module.exports = { app, convert, tva, remise };