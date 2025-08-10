// This file is the entry point for Vercel serverless functions
// It imports and exports the Express app

// Import the compiled Express app
const app = require('../dist/index.js');

// Export the app for Vercel
module.exports = app;
