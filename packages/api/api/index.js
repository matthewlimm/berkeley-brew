// Serverless function handler for Vercel deployment

// Express and required middleware
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Create Express app
const app = express();

// Environment variables
const frontendUrl = process.env.FRONTEND_URL || process.env.VERCEL_URL || 'http://localhost:3000';
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors({
  origin: frontendUrl,
  credentials: true
}));
app.use(helmet());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    environment: isProduction ? 'production' : 'development',
    timestamp: new Date().toISOString(),
    vercel: true
  });
});

// Simple placeholder endpoints for testing
app.get('/api/cafes', (req, res) => {
  res.json({
    status: 'success',
    message: 'API is working',
    data: {
      cafes: []
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
    path: req.path
  });
});

// Export the Express app as a serverless function
module.exports = app;
