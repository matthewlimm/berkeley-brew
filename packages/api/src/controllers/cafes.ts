import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod'
import { supabase, type Database } from '../db'
import { AppError } from '../middleware/errorHandler'


//separate logic for cafes in this file
const app = express();
type Cafe = Database['public']['Tables']['cafes']['Row']
type Review = Database['public']['Tables']['reviews']['Row']


// Validation schema for reviews
const reviewSchema = z.object({
    content: z.string().min(1),
    rating: z.number().min(0).max(5)
  })


//functionality for getting all cafes
const getAllCafes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { data: cafes, error } = await supabase
          .from('cafes')
          .select(`
            *,
            reviews (
              rating
            )
          `)
          .order('name')

        const { data: maxRating, error: maxRatingError } = await supabase
            .from('cafes')
            .select(`
            MAX(rating) as maxRating, 
            reviews(
                rating
            )
            `)
            .order('name')
    
        if (error) {
          return next(new AppError(`Failed to fetch cafes: ${error.message}`, 500))
        }

        if (maxRatingError) {
            return next(new AppError(`Failed to fetch cafes: ${maxRatingError.message}`, 500))
        }
    
    const cafesWithAvgRating = cafes.map(cafe => {
        const reviews = cafe.reviews as { rating: number }[] || []
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : null
  
        return {
          ...cafe,
          average_rating: avgRating,
          review_count: reviews.length
        }
    })


    res.json({
        status: 'success',
        data: {
          cafes: cafesWithAvgRating,

        }
      })

    }
    catch(error) {
        next(error)
    }
}

const getCafeByid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Fetch a single cafe with associated reviews and user profiles (username)
    const { data: cafe, error } = await supabase
      .from('cafes')
      .select(`
        *,
        reviews (
          id,
          content,
          rating,
          created_at,
          profiles (
            username
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return next(new AppError('Cafe not found', 404));
      }
      return next(new AppError(`Failed to fetch cafe: ${error.message}`, 500));
    }

    // Get reviews and calculate average rating
    const reviews = cafe.reviews as { rating: number }[] || [];
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;

    res.json({
      status: 'success',
      data: {
        cafe: {
          ...cafe,
          average_rating: avgRating,
          review_count: reviews.length,
          reviews, // Include the reviews with the cafe data
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


// POST /api/cafes/:id/reviews
const cafeReviews = async (req : Request, res : Response, next : NextFunction) => {
    try {
      const { id: cafe_id } = req.params
      const validation = reviewSchema.safeParse(req.body)
      
      if (!validation.success) {
        return next(new AppError('Invalid review data', 400))
      }
  
      const { content, rating } = validation.data
  
      // First check if cafe exists
      const { data: cafe, error: cafeError } = await supabase
        .from('cafes')
        .select('id')
        .eq('id', cafe_id)
        .single()
  
      if (cafeError) {
        if (cafeError.code === 'PGRST116') {
          return next(new AppError('Cafe not found', 404))
        }
        return next(new AppError(`Failed to verify cafe: ${cafeError.message}`, 500))
      }
  
      // Get user ID from auth (you'll need to implement auth middleware) -> Need to still implement this with authentication
      const user_id = req.user?.id // This will need to be set by your auth middleware
      if (!user_id) {
        return next(new AppError('Authentication required', 401))
      }
  
      // Create review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          cafe_id,
          user_id,
          content,
          rating
        })
  
      if (reviewError) {
        if (reviewError.code === '23505') { // Unique violation
          return next(new AppError('You have already reviewed this cafe', 400))
        }
        return next(new AppError(`Failed to create review: ${reviewError.message}`, 500))
      }
  
      res.status(201).json({
        status: 'success',
        message: 'Review created successfully'
      })
    } catch (error) {
      next(error)
    }
  }

export {getAllCafes, getCafeByid, cafeReviews}