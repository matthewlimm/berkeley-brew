"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.updateReview = exports.addCafeReview = exports.getCafeById = exports.getAllCafes = void 0;
const zod_1 = require("zod");
const db_1 = require("../db");
const errorHandler_1 = require("../middleware/errorHandler");
// Validation schema for reviews
const reviewSchema = zod_1.z.object({
    content: zod_1.z.string().min(0),
    grindability_score: zod_1.z.number().min(0).max(5),
    student_friendliness_score: zod_1.z.number().min(0).max(5),
    coffee_quality_score: zod_1.z.number().min(0).max(5),
    vibe_score: zod_1.z.number().min(0).max(5)
});
// Get all cafes with their average rating
const getAllCafes = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get cafes with their reviews
        const { data: cafes, error } = yield db_1.supabase
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
                popular_times,
                popular_times_updated_at,
                place_id,
                business_hours,
                price_category,
                location,
                reviews (
                    grindability_score,
                    student_friendliness_score,
                    coffee_quality_score,
                    vibe_score,
                    golden_bear_score
                )
            `)
            .order('name');
        if (error) {
            return next(new errorHandler_1.AppError('Failed to fetch cafes: ' + error.message, 500));
        }
        if (!cafes) {
            return next(new errorHandler_1.AppError('No cafes found', 404));
        }
        // Calculate average rating for each cafe
        const cafesWithAvgRating = cafes.map(cafe => {
            // Use type assertion to handle the reviews
            const reviews = (cafe.reviews || []).filter((r) => r && r.golden_bear_score !== undefined);
            const avgRating = reviews.length > 0
                ? reviews.reduce((sum, r) => sum + Number(r.golden_bear_score), 0) / reviews.length
                : null;
            return Object.assign(Object.assign({}, cafe), { average_rating: avgRating, review_count: reviews.length });
        });
        res.status(200).json({
            status: 'success',
            data: {
                cafes: cafesWithAvgRating
            }
        });
    }
    catch (err) {
        next(new errorHandler_1.AppError('An error occurred while fetching cafes', 500));
    }
});
exports.getAllCafes = getAllCafes;
// Get a single cafe with its reviews and realtime data
const getCafeById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Get cafe with reviews (ignoring realtime data for now)
        const { data: cafe, error } = yield db_1.supabase
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
                place_id,
                business_hours,
                coffee_quality_score,
                vibe_score,
                golden_bear_score,
                popular_times,
                popular_times_updated_at,
                price_category,
                location,
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
            .single();
        if (error) {
            return next(new errorHandler_1.AppError('Failed to fetch cafe: ' + error.message, 500));
        }
        if (!cafe) {
            return next(new errorHandler_1.AppError('Cafe not found', 404));
        }
        // If there are reviews, fetch the user information for each review
        if (cafe.reviews && cafe.reviews.length > 0) {
            // Get all unique user IDs from the reviews
            const userIds = cafe.reviews
                .map(review => review.user_id)
                .filter((id) => id !== null && id !== undefined);
            // Fetch user information for these IDs
            const { data: users, error: userError } = yield db_1.supabase
                .from('users')
                .select('id, username')
                .in('id', userIds);
            if (userError) {
                console.error('Error fetching user data:', userError);
                // Continue without user data rather than failing the whole request
            }
            else if (users) {
                // Create a map of user_id to user data for quick lookup
                const userMap = users.reduce((map, user) => {
                    if (user && user.id) {
                        map[user.id] = user;
                    }
                    return map;
                }, {});
                // Add user data to each review
                cafe.reviews = cafe.reviews.map((review) => {
                    var _a, _b;
                    return (Object.assign(Object.assign({}, review), { updated_at: (_a = review.updated_at) !== null && _a !== void 0 ? _a : null, created_at: (_b = review.created_at) !== null && _b !== void 0 ? _b : null, user: review.user_id && userMap[review.user_id]
                            ? userMap[review.user_id]
                            : { username: 'Unknown User' } }));
                });
            }
        }
        // Calculate average rating
        const reviews = cafe.reviews || [];
        const ratings = reviews.map(review => review.golden_bear_score);
        const avgRating = ratings.length > 0
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            : 0;
        // Add placeholder for realtime data (removed from query)
        const realtimeData = {
            wifi_availability: null,
            outlet_availability: null,
            seating: null
        };
        res.status(200).json({
            status: 'success',
            data: {
                cafe: Object.assign(Object.assign({}, cafe), { realtime: [realtimeData], average_rating: avgRating, review_count: reviews.length })
            }
        });
    }
    catch (err) {
        next(new errorHandler_1.AppError('An error occurred while fetching the cafe', 500));
    }
});
exports.getCafeById = getCafeById;
// Add a review to a cafe
const addCafeReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { id: cafeId } = req.params;
        // Validate request body
        const validation = reviewSchema.safeParse(req.body);
        if (!validation.success) {
            return next(new errorHandler_1.AppError('Invalid review data: ' + validation.error.message, 400));
        }
        const { content, grindability_score, student_friendliness_score, coffee_quality_score, vibe_score } = validation.data;
        // Get user from request (set by auth middleware)
        const user = req.user;
        if (!user) {
            return next(new errorHandler_1.AppError('Authentication required', 401));
        }
        // Debug user info
        console.log('User from request:', user.id, user.email);
        // Check if cafe exists
        const { data: cafe, error: cafeError } = yield db_1.supabase
            .from('cafes')
            .select('id')
            .eq('id', cafeId)
            .single();
        if (cafeError || !cafe) {
            return next(new errorHandler_1.AppError('Cafe not found', 404));
        }
        // Check if user has already reviewed this cafe
        const { data: existingReview, error: reviewCheckError } = yield db_1.supabase
            .from('reviews')
            .select()
            .eq('cafe_id', cafeId)
            .eq('user_id', user.id)
            .single();
        if (existingReview) {
            return next(new errorHandler_1.AppError('You have already reviewed this cafe', 400));
        }
        // First, ensure the user exists in the public.users table
        const { data: existingUser, error: userCheckError } = yield db_1.supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();
        // If user doesn't exist in public schema, create them
        if (!existingUser) {
            // Get name from user metadata if available
            const fullName = ((_a = user.user_metadata) === null || _a === void 0 ? void 0 : _a.name) || ((_b = user.user_metadata) === null || _b === void 0 ? void 0 : _b.full_name) || '';
            const { error: createUserError } = yield db_1.supabase
                .from('users')
                .insert({
                id: user.id,
                username: ((_c = user.user_metadata) === null || _c === void 0 ? void 0 : _c.username) || ((_d = user.email) === null || _d === void 0 ? void 0 : _d.split('@')[0]) || 'user',
                full_name: fullName,
                updated_at: new Date().toISOString()
            });
            if (createUserError) {
                return next(new errorHandler_1.AppError('Failed to create user profile: ' + createUserError.message, 500));
            }
        }
        // Add the review directly to the database
        console.log('Attempting to insert review with user_id:', user.id, 'for cafe_id:', cafeId);
        try {
            // The issue is that we're using the service role key, which bypasses RLS
            // But we need to tell Supabase which user we're acting on behalf of
            // Get the JWT token from the request
            const token = ((_e = req.headers.authorization) === null || _e === void 0 ? void 0 : _e.split(' ')[1]) || '';
            // Create a new Supabase client with the anon key
            const { createClient } = yield Promise.resolve().then(() => __importStar(require('@supabase/supabase-js')));
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
            const { data: authData, error: authError } = yield anonClient.auth.getUser();
            if (authError) {
                console.error('Auth session error:', authError);
                return next(new errorHandler_1.AppError('Authentication error: ' + authError.message, 401));
            }
            console.log('Auth user verified successfully:', !!authData.user);
            // Now insert the review with the client that respects RLS
            const { error } = yield anonClient
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
            });
            if (error) {
                console.error('Review insert error:', error);
                return next(new errorHandler_1.AppError('Failed to create review: ' + error.message, 500));
            }
            console.log('Review created successfully with proper authentication');
        }
        catch (err) {
            console.error('Unexpected error during review creation:', err);
            return next(new errorHandler_1.AppError('Unexpected error during review creation', 500));
        }
        res.status(201).json({
            status: 'success',
            data: { message: 'Review submitted successfully' }
        });
    }
    catch (err) {
        next(new errorHandler_1.AppError('An error occurred while creating the review', 500));
    }
});
exports.addCafeReview = addCafeReview;
// Update a review
const updateReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('updateReview route hit');
    try {
        console.log('Update review request received');
        const { reviewId } = req.params;
        const user = req.user;
        console.log('Review ID:', reviewId);
        console.log('Request body:', req.body);
        if (!user) {
            console.error('No authenticated user found in request.');
            return next(new errorHandler_1.AppError('You must be logged in to update a review', 401));
        }
        const userId = user.id;
        console.log('User from request:', userId);
        // First check if the review exists and belongs to the user
        const { data: existingReview, error: findError } = yield db_1.supabase
            .from('reviews')
            .select('*')
            .eq('id', reviewId)
            .eq('user_id', userId)
            .single();
        console.log('Pre-update fetch result:', existingReview, 'Error:', findError);
        if (findError || !existingReview) {
            console.error('Review not found or not owned by user. reviewId:', reviewId, 'userId:', userId);
            return next(new errorHandler_1.AppError('Review not found or you do not have permission to update it', 404));
        }
        // Validate the request body
        const reviewSchema = zod_1.z.object({
            content: zod_1.z.string().min(0).max(1000),
            grindability_score: zod_1.z.number().min(1).max(5),
            student_friendliness_score: zod_1.z.number().min(1).max(5),
            coffee_quality_score: zod_1.z.number().min(1).max(5),
            vibe_score: zod_1.z.number().min(1).max(5)
        });
        let validatedData;
        try {
            validatedData = reviewSchema.parse(req.body);
        }
        catch (error) {
            console.error('Validation error:', error);
            return next(new errorHandler_1.AppError('Invalid review data', 400));
        }
        // Calculate golden_bear_score as the average of the 4 subscores
        const golden_bear_score = (validatedData.grindability_score +
            validatedData.student_friendliness_score +
            validatedData.coffee_quality_score +
            validatedData.vibe_score) / 4;
        console.log('Calculated golden_bear_score:', golden_bear_score);
        console.log('Preparing to update review...');
        console.log('Review id:', reviewId);
        console.log('User id:', userId);
        const updatePayload = Object.assign(Object.assign({}, validatedData), { golden_bear_score: parseFloat(golden_bear_score.toFixed(1)), updated_at: new Date().toISOString(), cafe_id: existingReview.cafe_id, user_id: existingReview.user_id });
        console.log('Update payload:', updatePayload);
        // Create a per-request Supabase client with the user's JWT for authenticated update
        const { createClient } = require('@supabase/supabase-js');
        const userAccessToken = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        const supabaseWithAuth = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
            global: {
                headers: {
                    Authorization: `Bearer ${userAccessToken}`,
                },
            },
        });
        // Update review using authenticated client
        const { data: updated, error: updateError } = yield supabaseWithAuth
            .from('reviews')
            .update(updatePayload)
            .eq('id', reviewId)
            .eq('user_id', userId)
            .select('*');
        console.log('Review update result:', updated, updateError);
        if (updateError) {
            return next(new errorHandler_1.AppError('Failed to update review: ' + updateError.message, 500));
        }
        if (!updated || (Array.isArray(updated) && updated.length === 0)) {
            console.error('No rows updated. id:', reviewId, 'user_id:', userId);
            return next(new errorHandler_1.AppError('No review updated (not found or not owned by user)', 404));
        }
        // Always use the first updated review (should only ever be one)
        const updatedReview = Array.isArray(updated) ? updated[0] : updated;
        // Recalculate cafe scores after review update
        if (existingReview.cafe_id) {
            yield updateCafeScores(existingReview.cafe_id);
        }
        res.status(200).json({
            status: 'success',
            data: {
                review: updatedReview
            }
        });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return next(new errorHandler_1.AppError('Invalid review data: ' + err.errors.map(e => e.message).join(', '), 400));
        }
        next(new errorHandler_1.AppError('An error occurred while updating the review', 500));
    }
});
exports.updateReview = updateReview;
// Delete a review
const deleteReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        console.log('Delete review request received');
        console.log('Review ID:', req.params.reviewId);
        console.log('User from request:', (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const { reviewId } = req.params;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId) {
            console.log('No authenticated user found');
            return next(new errorHandler_1.AppError('You must be logged in to delete a review', 401));
        }
        // Create a per-request Supabase client with the user's JWT for RLS (matching updateReview)
        const { createClient } = require('@supabase/supabase-js');
        const userAccessToken = (_c = req.headers.authorization) === null || _c === void 0 ? void 0 : _c.replace('Bearer ', '');
        const supabaseWithAuth = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
            global: {
                headers: {
                    Authorization: `Bearer ${userAccessToken}`,
                },
            },
        });
        // First check if the review exists and belongs to the user using the authenticated client
        const { data: existingReview, error: findError } = yield supabaseWithAuth
            .from('reviews')
            .select('cafe_id')
            .eq('id', reviewId)
            .eq('user_id', userId)
            .single();
        if (findError || !existingReview) {
            return next(new errorHandler_1.AppError('Review not found or you do not have permission to delete it', 404));
        }
        // Store the cafe_id for later recalculation
        const cafeId = existingReview.cafe_id;
        // Delete the review using the authenticated client
        const { error: deleteError, count } = yield supabaseWithAuth
            .from('reviews')
            .delete({ count: 'exact' })
            .eq('id', reviewId)
            .eq('user_id', userId);
        if (deleteError) {
            return next(new errorHandler_1.AppError('Failed to delete review: ' + deleteError.message, 500));
        }
        if (count === 0) {
            return next(new errorHandler_1.AppError('No review deleted (not found or not owned by user)', 404));
        }
        // Recalculate cafe scores after review deletion
        if (cafeId) {
            yield updateCafeScores(cafeId);
        }
        res.status(200).json({
            status: 'success',
            data: null
        });
    }
    catch (err) {
        next(new errorHandler_1.AppError('An error occurred while deleting the review', 500));
    }
});
exports.deleteReview = deleteReview;
// Helper function to update cafe scores after review changes
const updateCafeScores = (cafeId) => __awaiter(void 0, void 0, void 0, function* () {
    // Get all reviews for the cafe
    const { data: reviews, error } = yield db_1.supabase
        .from('reviews')
        .select('golden_bear_score, grindability_score, student_friendliness_score, coffee_quality_score, vibe_score')
        .eq('cafe_id', cafeId);
    if (error || !reviews) {
        console.error('Error fetching reviews for score update:', error);
        return;
    }
    // Calculate average scores
    const calculateAverage = (field) => {
        const validScores = reviews
            .map((r) => r[field])
            .filter((score) => score !== null && score !== undefined && !isNaN(Number(score)));
        return validScores.length > 0
            ? validScores.reduce((sum, score) => sum + Number(score), 0) / validScores.length
            : null;
    };
    const grindabilityAvg = calculateAverage('grindability_score');
    const studentFriendlinessAvg = calculateAverage('student_friendliness_score');
    const coffeeQualityAvg = calculateAverage('coffee_quality_score');
    const vibeAvg = calculateAverage('vibe_score');
    const goldenBearAvg = calculateAverage('golden_bear_score');
    // Update the cafe with new average scores
    yield db_1.supabase
        .from('cafes')
        .update({
        grindability_score: grindabilityAvg,
        student_friendliness_score: studentFriendlinessAvg,
        coffee_quality_score: coffeeQualityAvg,
        vibe_score: vibeAvg,
        golden_bear_score: goldenBearAvg,
        updated_at: new Date().toISOString()
    })
        .eq('id', cafeId);
});
