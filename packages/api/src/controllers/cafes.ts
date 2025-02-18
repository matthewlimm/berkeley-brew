import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod'
import { supabase, type Database } from '../db'
import { AppError } from '../middleware/errorHandler'

type Cafe = Database['public']['Tables']['cafes']['Row']
type Review = Database['public']['Tables']['reviews']['Row']
type CafeRealtimeData = Database['public']['Tables']['cafes_realtime_data']['Row']

// Validation schema for reviews
const reviewSchema = z.object({
    content: z.string().min(1),
    rating: z.number().min(0).max(5)
})

// Get all cafes with their average rating
const getAllCafes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get cafes with their reviews
        const { data: cafes, error } = await supabase
            .from('cafes')
            .select(`
                id,
                name,
                address,
                created_at,
                updated_at,
                reviews (
                    rating
                )
            `)
            .order('name')

        if (error) {
            return next(new AppError('Failed to fetch cafes: ' + error.message, 500))
        }

        if (!cafes) {
            return next(new AppError('No cafes found', 404))
        }

        // Calculate average rating for each cafe
        const cafesWithAvgRating = cafes.map(cafe => {
            const reviews = (cafe.reviews as { rating: number }[]) || []
            const avgRating = reviews.length > 0
                ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
                : null

            return {
                ...cafe,
                average_rating: avgRating,
                review_count: reviews.length
            }
        })

        res.status(200).json({
            status: 'success',
            data: {
                cafes: cafesWithAvgRating
            }
        })
    } catch (err) {
        next(new AppError('An error occurred while fetching cafes', 500))
    }
}

// Get a single cafe with its reviews and realtime data
const getCafeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params

        // Get cafe with reviews and realtime data
        const { data: cafe, error } = await supabase
            .from('cafes')
            .select(`
                id,
                name,
                address,
                created_at,
                updated_at,
                reviews (
                    id,
                    content,
                    rating,
                    created_at,
                    user:users (
                        id,
                        username
                    )
                ),
                realtime:cafes_realtime_data (
                    wifi_availability,
                    outlet_availability,
                    seating
                )
            `)
            .eq('id', id)
            .single()

        if (error) {
            return next(new AppError('Failed to fetch cafe: ' + error.message, 500))
        }

        if (!cafe) {
            return next(new AppError('Cafe not found', 404))
        }

        // Calculate average rating
        const reviews = (cafe.reviews as any[]) || []
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
            : null

        res.status(200).json({
            status: 'success',
            data: {
                cafe: {
                    ...cafe,
                    average_rating: avgRating,
                    review_count: reviews.length
                }
            }
        })
    } catch (err) {
        next(new AppError('An error occurred while fetching the cafe', 500))
    }
}

// Add a review to a cafe
const addCafeReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: cafeId } = req.params
        
        // Validate request body
        const validation = reviewSchema.safeParse(req.body)
        if (!validation.success) {
            return next(new AppError('Invalid review data: ' + validation.error.message, 400))
        }

        const { content, rating } = validation.data

        // Get user ID from Supabase auth context
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return next(new AppError('Authentication required', 401))
        }

        // Check if cafe exists
        const { data: cafe, error: cafeError } = await supabase
            .from('cafes')
            .select('id')
            .eq('id', cafeId)
            .single()

        if (cafeError || !cafe) {
            return next(new AppError('Cafe not found', 404))
        }

        // Check if user has already reviewed this cafe
        const { data: existingReview, error: reviewCheckError } = await supabase
            .from('reviews')
            .select()
            .eq('cafe_id', cafeId)
            .eq('user_id', user.id)
            .single()

        if (existingReview) {
            return next(new AppError('You have already reviewed this cafe', 400))
        }

        // Add the review
        const { data: review, error: insertError } = await supabase
            .from('reviews')
            .insert({
                cafe_id: cafeId,
                user_id: user.id,
                content,
                rating
            })
            .select(`
                id,
                content,
                rating,
                created_at,
                user:users (
                    id,
                    username
                )
            `)
            .single()

        if (insertError) {
            return next(new AppError('Failed to create review: ' + insertError.message, 500))
        }

        res.status(201).json({
            status: 'success',
            data: { review }
        })
    } catch (err) {
        next(new AppError('An error occurred while creating the review', 500))
    }
}

export { getAllCafes, getCafeById, addCafeReview }