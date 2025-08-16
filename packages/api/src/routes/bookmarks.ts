import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../db';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Helper function to create a Supabase client with JWT token
const createSupabaseClientWithToken = (token: string) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      supabaseUrl: !!supabaseUrl,
      supabaseAnonKey: !!supabaseAnonKey,
      env: {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    });
    throw new Error('Supabase configuration is missing');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
};

// Get all bookmarks for the authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    // Ensure we have a valid user ID
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    // Get the auth token from the request
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    
    if (!token) {
      return res.status(401).json({ error: 'Valid authentication token required' });
    }
    
    const userId = req.user.id;
    
    // Create a new Supabase client with the user's token
    const supabaseWithAuth = createSupabaseClientWithToken(token);
    
    // Check if reviews should be included
    const includeReviews = req.query.includeReviews === 'true';
    
    let selectQuery = '*, cafes(*)';
    if (includeReviews) {
      selectQuery = `*, cafes(
        id,
        name,
        address,
        created_at,
        updated_at,
        image_url,
        grindability_score,
        student_friendliness_score,
        coffee_quality_score,
        vibe_score,
        golden_bear_score,
        price_category,
        latitude,
        longitude,
        popular_times,
        popular_times_updated_at,
        place_id,
        business_hours,
        reviews (
          grindability_score,
          student_friendliness_score,
          coffee_quality_score,
          vibe_score,
          golden_bear_score
        )
      )`;
    }

    const { data, error } = await supabaseWithAuth
      .from('bookmarks')
      .select(selectQuery)
      .eq('user_id', userId);

    if (error) throw error;
    
    // If reviews are included, calculate average ratings and subscores
    if (includeReviews && data) {
      const bookmarksWithAvgRating = data.map((bookmark: any) => {
        if (bookmark.cafes && bookmark.cafes.reviews) {
          const reviews = bookmark.cafes.reviews.filter((r: any) => r && r.golden_bear_score !== undefined);
          
          // Calculate average overall rating
          const avgRating = reviews.length > 0
            ? reviews.reduce((sum: number, r: any) => sum + Number(r.golden_bear_score), 0) / reviews.length
            : null;
          
          // Calculate average subscores - helper function
          const calculateAverage = (field: string) => {
            const validScores = reviews
              .map((r: any) => r[field])
              .filter((score: any) => score !== null && score !== undefined && !isNaN(Number(score)));
              
            return validScores.length > 0
              ? validScores.reduce((sum: number, score: any) => sum + Number(score), 0) / validScores.length
              : null;
          };
          
          const grindabilityAvg = calculateAverage('grindability_score');
          const studentFriendlinessAvg = calculateAverage('student_friendliness_score');
          const coffeeQualityAvg = calculateAverage('coffee_quality_score');
          const vibeAvg = calculateAverage('vibe_score');
          
          return {
            ...bookmark,
            cafes: {
              ...bookmark.cafes,
              average_rating: avgRating,
              review_count: reviews.length,
              // Override cafe-level scores with calculated averages from reviews
              grindability_score: grindabilityAvg,
              student_friendliness_score: studentFriendlinessAvg,
              coffee_quality_score: coffeeQualityAvg,
              vibe_score: vibeAvg,
              golden_bear_score: avgRating
            }
          };
        }
        return bookmark;
      });
      
      return res.status(200).json(bookmarksWithAvgRating);
    }
    
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error fetching bookmarks:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Add a bookmark
router.post('/', requireAuth, async (req, res) => {
  try {
    const { cafe_id } = req.body;
    
    if (!cafe_id) {
      return res.status(400).json({ error: 'Cafe ID is required' });
    }
    
    // Ensure we have a valid user ID and token
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    // Get the auth token from the request
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    
    if (!token) {
      return res.status(401).json({ error: 'Valid authentication token required' });
    }
    
    const userId = req.user.id;
    console.log('Adding bookmark for user:', userId, 'cafe:', cafe_id);
    
    // Create a new Supabase client with the user's token
    const supabaseWithAuth = createSupabaseClientWithToken(token);
    
    // Insert bookmark using the authenticated client
    const { data, error } = await supabaseWithAuth
      .from('bookmarks')
      .insert({
        user_id: userId,
        cafe_id
      })
      .select();

    if (error) {
      // If the error is a duplicate bookmark, return a friendly message
      if (error.code === '23505') {
        return res.status(409).json({ error: 'You have already bookmarked this cafe' });
      }
      throw error;
    }

    return res.status(201).json(data[0]);
  } catch (error: any) {
    console.error('Error adding bookmark:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Check if a cafe is bookmarked by the user
router.get('/check/:cafeId', requireAuth, async (req, res) => {
  try {
    const { cafeId } = req.params;
    
    // Ensure we have a valid user ID
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    // Get the auth token from the request
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    
    if (!token) {
      return res.status(401).json({ error: 'Valid authentication token required' });
    }
    
    const userId = req.user.id;
    
    // Create a new Supabase client with the user's token
    const supabaseWithAuth = createSupabaseClientWithToken(token);
    
    const { data, error } = await supabaseWithAuth
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('cafe_id', cafeId)
      .maybeSingle();

    if (error) throw error;
    
    return res.status(200).json({ isBookmarked: !!data });
  } catch (error: any) {
    console.error('Error checking bookmark:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Delete a bookmark
router.delete('/:cafeId', requireAuth, async (req, res) => {
  try {
    const { cafeId } = req.params;
    
    // Ensure we have a valid user ID
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    // Get the auth token from the request
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    
    if (!token) {
      return res.status(401).json({ error: 'Valid authentication token required' });
    }
    
    const userId = req.user.id;
    
    // Create a new Supabase client with the user's token
    const supabaseWithAuth = createSupabaseClientWithToken(token);
    
    const { error } = await supabaseWithAuth
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('cafe_id', cafeId);

    if (error) throw error;
    
    return res.status(200).json({ message: 'Bookmark removed successfully' });
  } catch (error: any) {
    console.error('Error removing bookmark:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
