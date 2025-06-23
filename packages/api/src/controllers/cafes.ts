import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod'
import { supabase, type Database } from '../db'
import { AppError } from '../middleware/errorHandler'

type Cafe = Database['public']['Tables']['cafes']['Row']
type Review = Database['public']['Tables']['reviews']['Row']

// Validation schema for reviews
const reviewSchema = z.object({
    content: z.string().min(0),
    grindability_score: z.number().min(0).max(5),
    student_friendliness_score: z.number().min(0).max(5),
    coffee_quality_score: z.number().min(0).max(5),
    vibe_score: z.number().min(0).max(5)
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
                image_url,
                grindability_score,
                student_friendliness_score,
                coffee_quality_score,
                vibe_score,
                golden_bear_score,
                latitude,
                longitude,
                reviews (
                    grindability_score,
                    student_friendliness_score,
                    coffee_quality_score,
                    vibe_score,
                    golden_bear_score
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
            // Use type assertion to handle the reviews
            const reviews = ((cafe.reviews as any) || []).filter((r: any) => r && r.golden_bear_score !== undefined)
            const avgRating = reviews.length > 0
                ? reviews.reduce((sum: number, r: any) => sum + Number(r.golden_bear_score), 0) / reviews.length
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
                image_url,
                grindability_score,
                student_friendliness_score,
                coffee_quality_score,
                vibe_score,
                golden_bear_score,
                reviews (
                    id,
                    content,
                    golden_bear_score,
                    grindability_score,
                    student_friendliness_score,
                    coffee_quality_score,
                    vibe_score,
                    created_at,
                    updated_at,
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
            const userIds = (cafe.reviews as any[])
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
                cafe.reviews = (cafe.reviews as any[]).map((review: any) => ({
                    ...review,
                    updated_at: review.updated_at ?? null, // Always include updated_at, even if null
                    created_at: review.created_at ?? null, // Always include created_at for comparison
                    user: review.user_id && userMap[review.user_id] 
                        ? userMap[review.user_id] 
                        : { username: 'Unknown User' }
                }))
            }
        }

        // Calculate average rating
        const reviews = (cafe.reviews as any[]) || []
        const ratings = reviews.map(review => review.golden_bear_score)
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

        const { content, grindability_score, student_friendliness_score, coffee_quality_score, vibe_score } = validation.data

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
                    grindability_score,
                    student_friendliness_score,
                    coffee_quality_score,
                    vibe_score,
                    golden_bear_score: (grindability_score + student_friendliness_score + coffee_quality_score + vibe_score) / 4
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

// Update a review
const updateReview = async (req: Request, res: Response, next: NextFunction) => {
    console.log('updateReview route hit');
    try {
        console.log('Update review request received');
        const { reviewId } = req.params;
        const user = req.user;
        console.log('Review ID:', reviewId);
        console.log('Request body:', req.body);
        if (!user) {
            console.error('No authenticated user found in request.');
            return next(new AppError('You must be logged in to update a review', 401));
        }
        const userId = user.id;
        console.log('User from request:', userId);
        // First check if the review exists and belongs to the user
        const { data: existingReview, error: findError } = await supabase
            .from('reviews')
            .select('*')
            .eq('id', reviewId)
            .eq('user_id', userId)
            .single();
        console.log('Pre-update fetch result:', existingReview, 'Error:', findError);
        if (findError || !existingReview) {
            console.error('Review not found or not owned by user. reviewId:', reviewId, 'userId:', userId);
            return next(new AppError('Review not found or you do not have permission to update it', 404));
        }
        
        // Validate the request body
        const reviewSchema = z.object({
            content: z.string().min(0).max(1000),
            grindability_score: z.number().min(1).max(5),
            student_friendliness_score: z.number().min(1).max(5),
            coffee_quality_score: z.number().min(1).max(5),
            vibe_score: z.number().min(1).max(5)
        })
        
        let validatedData;
        try {
            validatedData = reviewSchema.parse(req.body);
        } catch (error) {
            console.error('Validation error:', error);
            return next(new AppError('Invalid review data', 400));
        }
        
        // Calculate golden_bear_score as the average of the 4 subscores
        const golden_bear_score = (
            validatedData.grindability_score +
            validatedData.student_friendliness_score +
            validatedData.coffee_quality_score +
            validatedData.vibe_score
        ) / 4;
        
        console.log('Calculated golden_bear_score:', golden_bear_score);
        
        console.log('Preparing to update review...');
        console.log('Review id:', reviewId);
        console.log('User id:', userId);
        const updatePayload = {
            ...validatedData,
            golden_bear_score: parseFloat(golden_bear_score.toFixed(1)),
            updated_at: new Date().toISOString(),
            cafe_id: existingReview.cafe_id,
            user_id: existingReview.user_id
        };
        console.log('Update payload:', updatePayload);

        // Create a per-request Supabase client with the user's JWT for authenticated update
        const { createClient } = require('@supabase/supabase-js');
        const userAccessToken = req.headers.authorization?.replace('Bearer ', '');
        const supabaseWithAuth = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${userAccessToken}`,
                    },
                },
            }
        );
        // Update review using authenticated client
        const { data: updated, error: updateError } = await supabaseWithAuth
            .from('reviews')
            .update(updatePayload)
            .eq('id', reviewId)
            .eq('user_id', userId)
            .select('*');
        console.log('Review update result:', updated, updateError);
        
        if (updateError) {
            return next(new AppError('Failed to update review: ' + updateError.message, 500));
        }
        
        if (!updated || (Array.isArray(updated) && updated.length === 0)) {
            console.error('No rows updated. id:', reviewId, 'user_id:', userId);
            return next(new AppError('No review updated (not found or not owned by user)', 404));
        }
        
        // Always use the first updated review (should only ever be one)
        const updatedReview = Array.isArray(updated) ? updated[0] : updated;
        
        // Recalculate cafe scores after review update
        if (existingReview.cafe_id) {
            await updateCafeScores(existingReview.cafe_id)
        }
        
        res.status(200).json({
            status: 'success',
            data: {
                review: updatedReview
            }
        })
    } catch (err) {
        if (err instanceof z.ZodError) {
            return next(new AppError('Invalid review data: ' + err.errors.map(e => e.message).join(', '), 400))
        }
        next(new AppError('An error occurred while updating the review', 500))
    }
}

// Delete a review
const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('Delete review request received');
        console.log('Review ID:', req.params.reviewId);
        console.log('User from request:', req.user?.id);
        
        const { reviewId } = req.params
        const userId = req.user?.id
        
        if (!userId) {
            console.log('No authenticated user found');
            return next(new AppError('You must be logged in to delete a review', 401))
        }
        
        // Create a per-request Supabase client with the user's JWT for RLS (matching updateReview)
        const { createClient } = require('@supabase/supabase-js');
        const userAccessToken = req.headers.authorization?.replace('Bearer ', '');
        const supabaseWithAuth = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${userAccessToken}`,
                    },
                },
            }
        );

        // First check if the review exists and belongs to the user using the authenticated client
        const { data: existingReview, error: findError } = await supabaseWithAuth
            .from('reviews')
            .select('cafe_id')
            .eq('id', reviewId)
            .eq('user_id', userId)
            .single();
        
        if (findError || !existingReview) {
            return next(new AppError('Review not found or you do not have permission to delete it', 404))
        }
        
        // Store the cafe_id for later recalculation
        const cafeId = existingReview.cafe_id;

        // Delete the review using the authenticated client
        const { error: deleteError, count } = await supabaseWithAuth
            .from('reviews')
            .delete({ count: 'exact' })
            .eq('id', reviewId)
            .eq('user_id', userId);
        
        if (deleteError) {
            return next(new AppError('Failed to delete review: ' + deleteError.message, 500))
        }
        if (count === 0) {
            return next(new AppError('No review deleted (not found or not owned by user)', 404));
        }
        
        // Recalculate cafe scores after review deletion
        if (cafeId) {
            await updateCafeScores(cafeId)
        }
        
        res.status(200).json({
            status: 'success',
            data: null
        })
    } catch (err) {
        next(new AppError('An error occurred while deleting the review', 500))
    }
}

// Helper function to update cafe scores after review changes
const updateCafeScores = async (cafeId: string) => {
    // Get all reviews for the cafe
    const { data: reviews, error } = await supabase
        .from('reviews')
        .select('golden_bear_score, grindability_score, student_friendliness_score, coffee_quality_score, vibe_score')
        .eq('cafe_id', cafeId)
        
    if (error || !reviews) {
        console.error('Error fetching reviews for score update:', error)
        return
    }
    
    // Calculate average scores
    const calculateAverage = (field: string) => {
        const validScores = reviews
            .map((r: any) => r[field])
            .filter((score: any) => score !== null && score !== undefined && !isNaN(Number(score)))
            
        return validScores.length > 0
            ? validScores.reduce((sum: number, score: any) => sum + Number(score), 0) / validScores.length
            : null
    }
    
    const grindabilityAvg = calculateAverage('grindability_score')
    const studentFriendlinessAvg = calculateAverage('student_friendliness_score')
    const coffeeQualityAvg = calculateAverage('coffee_quality_score')
    const vibeAvg = calculateAverage('vibe_score')
    const goldenBearAvg = calculateAverage('golden_bear_score')
    
    // Update the cafe with new average scores
    await supabase
        .from('cafes')
        .update({
            grindability_score: grindabilityAvg,
            student_friendliness_score: studentFriendlinessAvg,
            coffee_quality_score: coffeeQualityAvg,
            vibe_score: vibeAvg,
            golden_bear_score: goldenBearAvg,
            updated_at: new Date().toISOString()
        })
        .eq('id', cafeId)
}

export { getAllCafes, getCafeById, addCafeReview, updateReview, deleteReview }