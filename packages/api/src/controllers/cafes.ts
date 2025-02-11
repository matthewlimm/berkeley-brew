import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod'
import { supabase, type Database } from '../db'
import { AppError } from '../middleware/errorHandler'


//separate logic for cafes in this file

const app = express();
type Cafe = Database['public']['Tables']['cafes']['Row']

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

    const maxRatedCafes : Cafe[] = cafes.filter(cafe => cafe.rating == maxRating)

    res.json({
        status: 'success',
        data: {
          cafes: cafesWithAvgRating,
          maxRatedCafes: maxRatedCafes
        }
      })

    }
    catch(error) {
        next(error)
    }
}

//functionality for getting a cafe by an id
const getCafeByid =  async (req: Request, res: Response, next: NextFunction)  => {
    try {
      const { id } = req.params
      
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
        .single()
  
      if (error) {
        if (error.code === 'PGRST116') {
          return next(new AppError('Cafe not found', 404))
        }
        return next(new AppError(`Failed to fetch cafe: ${error.message}`, 500))
      }
  
      // Calculate average rating
      //need to separate routing for Review so will have to include this later
      const reviews = cafe.reviews as (Review & { profiles: { username: string | null } })[] || []
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null
  
      res.json({
        status: 'success',
        data: {
          cafe: {
            ...cafe,
            average_rating: avgRating,
            review_count: reviews.length
          }
        }
      })
    } catch (error) {
      next(error)
    }
}


  
