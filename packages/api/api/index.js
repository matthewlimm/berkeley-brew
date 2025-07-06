// Serverless function handler for Vercel deployment
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');

// Create Express app
const app = express();

// Environment variables
const frontendUrl = process.env.FRONTEND_URL || process.env.VERCEL_URL || 'http://localhost:3000';
const isProduction = process.env.NODE_ENV === 'production';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Initialize Supabase client
let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// Middleware
app.use(cors({
  origin: frontendUrl,
  credentials: true
}));
app.use(helmet());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    environment: isProduction ? 'production' : 'development',
    timestamp: new Date().toISOString(),
    vercel: true,
    supabase: supabase ? 'connected' : 'not connected'
  });
});

// Get all cafes
app.get('/api/cafes', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        status: 'error',
        message: 'Database connection not available'
      });
    }

    const { data, error } = await supabase
      .from('cafes')
      .select('*');

    if (error) throw error;

    return res.json({
      status: 'success',
      data: { cafes: data }
    });
  } catch (error) {
    console.error('Error fetching cafes:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch cafes',
      error: error.message
    });
  }
});

// Get cafe by ID
app.get('/api/cafes/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        status: 'error',
        message: 'Database connection not available'
      });
    }

    const { id } = req.params;
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        status: 'error',
        message: 'Cafe not found'
      });
    }

    return res.json({
      status: 'success',
      data: { cafe: data }
    });
  } catch (error) {
    console.error('Error fetching cafe:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch cafe',
      error: error.message
    });
  }
});

// Get cafe reviews
app.get('/api/cafes/:id/reviews', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        status: 'error',
        message: 'Database connection not available'
      });
    }

    const { id } = req.params;
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(*)')
      .eq('cafe_id', id);

    if (error) throw error;

    return res.json({
      status: 'success',
      data: { reviews: data }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
});

// Auth middleware for protected routes
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!supabase) {
      return res.status(503).json({
        status: 'error',
        message: 'Authentication service not available'
      });
    }

    // Verify the token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
        error: error?.message
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication error',
      error: error.message
    });
  }
};

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    error: err.message
  });
});

// Export the Express app as a serverless function
module.exports = app;
