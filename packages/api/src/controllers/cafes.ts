import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod'
import { supabase, type Database } from '../db'
import { AppError } from '../middleware/errorHandler'

type Cafe = Database['public']['Tables']['cafes']['Row']
type Review = Database['public']['Tables']['reviews']['Row']

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

        // Get cafe with reviews (ignoring realtime data for now)
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
                    user_id
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
        
        // If there are reviews, fetch the user information for each review
        if (cafe.reviews && cafe.reviews.length > 0) {
            // Get all unique user IDs from the reviews
            const userIds = cafe.reviews
                .map(review => review.user_id)
                .filter((id): id is string => id !== null && id !== undefined)
            
            // Fetch user information for these IDs
            const { data: users, error: userError } = await supabase
                .from('users')
                .select('id, username')
                .in('id', userIds)
            
            if (userError) {
                console.error('Error fetching user data:', userError)
                // Continue without user data rather than failing the whole request
            } else if (users) {
                // Create a map of user_id to user data for quick lookup
                const userMap = users.reduce((map, user) => {
                    if (user && user.id) {
                        map[user.id] = user
                    }
                    return map
                }, {} as Record<string, any>)
                
                // Add user data to each review
                cafe.reviews = cafe.reviews.map(review => ({
                    ...review,
                    user: review.user_id && userMap[review.user_id] 
                        ? userMap[review.user_id] 
                        : { username: 'Unknown User' }
                }))
            }
        }

        // Calculate average rating
        const reviews = (cafe.reviews as any[]) || []
        const ratings = reviews.map(review => review.rating)
        const avgRating = ratings.length > 0
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            : 0

        // Add placeholder for realtime data (removed from query)
        const realtimeData = {
            wifi_availability: null,
            outlet_availability: null,
            seating: null
        }

        res.status(200).json({
            status: 'success',
            data: {
                cafe: {
                    ...cafe,
                    realtime: [realtimeData], // Match the original structure expected by frontend
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

        // Get user from request (set by auth middleware)
        const user = req.user
        
        if (!user) {
            return next(new AppError('Authentication required', 401))
        }
        
        // Debug user info
        console.log('User from request:', user.id, user.email)

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

        // First, ensure the user exists in the public.users table
        const { data: existingUser, error: userCheckError } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();
            
        // If user doesn't exist in public schema, create them
        if (!existingUser) {
            // Get name from user metadata if available
            const fullName = user.user_metadata?.name || user.user_metadata?.full_name || '';
            
            const { error: createUserError } = await supabase
                .from('users')
                .insert({
                    id: user.id,
                    username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
                    full_name: fullName,
                    updated_at: new Date().toISOString()
                });
                
            if (createUserError) {
                return next(new AppError('Failed to create user profile: ' + createUserError.message, 500));
            }
        }
        
        // Add the review directly to the database
        console.log('Attempting to insert review with user_id:', user.id, 'for cafe_id:', cafeId)
        
        try {
            // The issue is that we're using the service role key, which bypasses RLS
            // But we need to tell Supabase which user we're acting on behalf of
            
            // Get the JWT token from the request
            const token = req.headers.authorization?.split(' ')[1] || '';
            
            // Create a new Supabase client with the anon key
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
            
            // Create a client with the auth header already set
            const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            });
            
            // Verify the session is valid
            const { data: authData, error: authError } = await anonClient.auth.getUser();
            
            if (authError) {
                console.error('Auth session error:', authError);
                return next(new AppError('Authentication error: ' + authError.message, 401));
            }
            
            console.log('Auth user verified successfully:', !!authData.user);
            
            // Now insert the review with the client that respects RLS
            const { error } = await anonClient
                .from('reviews')
                .insert({
                    cafe_id: cafeId,
                    user_id: user.id,
                    content,
                    rating
                })

            if (error) {
                console.error('Review insert error:', error)
                return next(new AppError('Failed to create review: ' + error.message, 500))
            }
            
            console.log('Review created successfully with proper authentication')
        } catch (err) {
            console.error('Unexpected error during review creation:', err)
            return next(new AppError('Unexpected error during review creation', 500))
        }

        res.status(201).json({
            status: 'success',
            data: { message: 'Review submitted successfully' }
        })
    } catch (err) {
        next(new AppError('An error occurred while creating the review', 500))
    }
}

export { getAllCafes, getCafeById, addCafeReview }