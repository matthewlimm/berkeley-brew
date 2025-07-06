// Serverless function handler for Vercel deployment
const app = require('../dist/index').default;

// Export the Express app as a serverless function
module.exports = app;
