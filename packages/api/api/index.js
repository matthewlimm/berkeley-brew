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

// Format the frontend URL correctly for CORS
let corsOrigin = frontendUrl;
if (corsOrigin.startsWith('http')) {
  // URL is already formatted correctly
} else {
  // Add https:// prefix if missing
  corsOrigin = `https://${corsOrigin}`;
}

// Add the web domain explicitly for CORS
const allowedOrigins = [
  corsOrigin,
  'https://berkeley-brew-web.vercel.app',
  'http://localhost:3000'
];

// Initialize Supabase client
let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle OPTIONS preflight requests
app.options('*', cors());

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Fix double slash issue by normalizing paths
app.use((req, res, next) => {
  if (req.path.includes('//')) {
    const normalizedPath = req.path.replace(/\/\//g, '/');
    return res.redirect(307, `${req.protocol}://${req.get('host')}${normalizedPath}`);
  }
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

// Add a review
app.post('/api/cafes/:id/reviews', authMiddleware, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        status: 'error',
        message: 'Database connection not available'
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    console.log(`Adding review for cafe ${id} by user ${userId}`);
    console.log('Review data:', { rating, comment });
    console.log('User object from auth middleware:', JSON.stringify(req.user, null, 2));

    if (!rating) {
      return res.status(400).json({
        status: 'error',
        message: 'Rating is required'
      });
    }

    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }

    // Check if user has already reviewed this cafe
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', userId)
      .eq('cafe_id', id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing review:', checkError);
      throw checkError;
    }

    let result;
    if (existingReview) {
      // Update existing review
      console.log('Updating existing review');
      result = await supabase
        .from('reviews')
        .update({
          rating,
          comment,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReview.id)
        .select();
    } else {
      // Create new review
      console.log('Creating new review');
      result = await supabase
        .from('reviews')
        .insert([
          {
            cafe_id: id,
            user_id: userId,
            rating,
            comment,
            created_at: new Date().toISOString()
          }
        ])
        .select();
    }

    if (result.error) {
      console.error('Error saving review:', result.error);
      throw result.error;
    }

    return res.status(201).json({
      status: 'success',
      data: { review: result.data[0] }
    });
  } catch (error) {
    console.error('Error adding review:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to add review',
      error: error.message
    });
  }
});

// Bookmarks endpoints
app.get('/api/bookmarks', authMiddleware, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        status: 'error',
        message: 'Database connection not available'
      });
    }

    const userId = req.user.id;
    console.log('Fetching bookmarks for user:', userId);

    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    return res.json(data);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch bookmarks',
      error: error.message
    });
  }
});

// Add a bookmark
app.post('/api/bookmarks', authMiddleware, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        status: 'error',
        message: 'Database connection not available'
      });
    }

    const userId = req.user.id;
    const { cafe_id } = req.body;

    console.log(`Adding bookmark for cafe ${cafe_id} by user ${userId}`);
    console.log('User object from auth middleware:', JSON.stringify(req.user, null, 2));
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    if (!cafe_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Cafe ID is required'
      });
    }

    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }

    // Check if bookmark already exists
    const { data: existingBookmark, error: checkError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('cafe_id', cafe_id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing bookmark:', checkError);
      throw checkError;
    }

    // If bookmark exists, return it
    if (existingBookmark) {
      console.log('Bookmark already exists');
      return res.json({
        status: 'success',
        data: { bookmark: existingBookmark },
        message: 'Bookmark already exists'
      });
    }

    // Otherwise create a new bookmark
    console.log('Creating new bookmark');
    const { data, error } = await supabase
      .from('bookmarks')
      .insert([
        {
          user_id: userId,
          cafe_id,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error creating bookmark:', error);
      throw error;
    }

    console.log('Bookmark created successfully:', data[0]);
    return res.status(201).json({
      status: 'success',
      data: { bookmark: data[0] }
    });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to add bookmark',
      error: error.message
    });
  }
});

// Delete a bookmark
app.delete('/api/bookmarks/:cafeId', authMiddleware, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        status: 'error',
        message: 'Database connection not available'
      });
    }

    const userId = req.user.id;
    const { cafeId } = req.params;

    console.log(`Removing bookmark for cafe ${cafeId} by user ${userId}`);

    const { data, error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('cafe_id', cafeId)
      .select();

    if (error) throw error;

    return res.json({
      status: 'success',
      data: { removed: data && data.length > 0 },
      message: data && data.length > 0 ? 'Bookmark removed' : 'Bookmark not found'
    });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to remove bookmark',
      error: error.message
    });
  }
});

// Auth middleware for protected routes
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  console.log('Auth middleware called');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  // For development/debugging, allow requests without auth
  if (!isProduction) {
    console.log('Auth bypassed in development mode');
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    return next();
  }
  
  if (!authHeader) {
    console.log('No authorization header provided');
    return res.status(401).json({ error: 'No authorization header provided' });
  }

  if (!authHeader.startsWith('Bearer ')) {
    console.log('Invalid authorization format');
    return res.status(401).json({ error: 'Invalid authorization format' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Token received (first 15 chars):', token.substring(0, 15) + '...');
  
  if (!supabase) {
    console.log('Supabase client not initialized');
    return res.status(500).json({ error: 'Supabase client not initialized' });
  }

  try {
    // Verify the token with Supabase
    console.log('Verifying token with Supabase...');
    supabase.auth.getUser(token)
      .then(({ data, error }) => {
        if (error) {
          console.error('Auth error from Supabase:', error);
          return res.status(401).json({ error: 'Invalid token', details: error.message });
        }

        if (!data || !data.user) {
          console.log('User not found in token data');
          return res.status(401).json({ error: 'User not found' });
        }

        console.log('User authenticated successfully:', data.user.id);
        // Add user to request object
        req.user = data.user;
        next();
      })
      .catch(error => {
        console.error('Exception in auth verification:', error);
        res.status(500).json({ error: 'Authentication error', details: error.message });
      });
  } catch (error) {
    console.error('Exception in auth middleware:', error);
    res.status(500).json({ error: 'Authentication error', details: error.message });
  }
}

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
