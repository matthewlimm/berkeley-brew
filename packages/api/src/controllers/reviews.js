"use strict";
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
exports.updateReview = void 0;
const zod_1 = require("zod");
const supabase_js_1 = require("@supabase/supabase-js");
const errorHandler_1 = require("../middleware/errorHandler");
const reviewUpdateSchema = zod_1.z.object({
    content: zod_1.z.string().min(1),
    grindability_score: zod_1.z.number().min(0).max(5),
    student_friendliness_score: zod_1.z.number().min(0).max(5),
    coffee_quality_score: zod_1.z.number().min(0).max(5),
    vibe_score: zod_1.z.number().min(0).max(5),
});
// PATCH /api/reviews/:id
const updateReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const user = req.user;
        // Extract user's JWT from Authorization header
        const userAccessToken = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        // Create a per-request Supabase client with the user's JWT for RLS
        const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
            global: {
                headers: {
                    Authorization: `Bearer ${userAccessToken}`
                }
            }
        });
        if (!user) {
            return next(new errorHandler_1.AppError('Authentication required', 401));
        }
        // Validate input
        const validation = reviewUpdateSchema.safeParse(req.body);
        if (!validation.success) {
            return next(new errorHandler_1.AppError('Invalid review update data: ' + validation.error.message, 400));
        }
        // Debug: print current auth user id
        console.log('Current auth user.id:', user.id);
        console.log('--- updateReview controller invoked ---');
        console.log('Request params:', req.params);
        console.log('Request body:', req.body);
        if (!user) {
            console.error('No user found in request.');
            return next(new errorHandler_1.AppError('User not authenticated', 401));
        }
        console.log('User from request:', user);
        try {
            // Validate input
            console.log('Validating input...');
            const validation = reviewUpdateSchema.safeParse(req.body);
            if (!validation.success) {
                console.error('Validation failed:', validation.error);
                return next(new errorHandler_1.AppError('Invalid input', 400));
            }
            console.log('Validation succeeded:', validation.data);
            // Check review exists and belongs to user
            console.log('Fetching review to check ownership...');
            const { data: review, error: reviewError } = yield supabase
                .from('reviews')
                .select('*')
                .eq('id', id)
                .eq('user_id', user.id)
                .maybeSingle();
            console.log('Fetched review before update:', review);
            if (reviewError) {
                console.error('Error fetching review:', reviewError);
            }
            if (reviewError || !review) {
                console.error('Review not found or not owned by user.');
                return next(new errorHandler_1.AppError('Review not found or not owned by user', 404));
            }
            // Prepare update payload
            console.log('Preparing to update review...');
            console.log('Review id:', id);
            console.log('User id:', user.id);
            const updatePayload = {
                content: validation.data.content,
                grindability_score: validation.data.grindability_score,
                student_friendliness_score: validation.data.student_friendliness_score,
                coffee_quality_score: validation.data.coffee_quality_score,
                vibe_score: validation.data.vibe_score,
                updated_at: new Date().toISOString()
            };
            console.log('Update payload:', updatePayload);
            // Update review
            console.log('Attempting to update review...');
            const { data: updated, error: updateError } = yield supabase
                .from('reviews')
                .update({
                content: validation.data.content,
                grindability_score: validation.data.grindability_score,
                student_friendliness_score: validation.data.student_friendliness_score,
                coffee_quality_score: validation.data.coffee_quality_score,
                vibe_score: validation.data.vibe_score,
                updated_at: new Date().toISOString()
            })
                .eq('id', id)
                .eq('user_id', user.id)
                .select('*');
            console.log('Review update result:', updated, updateError);
            if (updateError) {
                console.error('Error during update:', updateError);
                return next(new errorHandler_1.AppError('Failed to update review: ' + updateError.message, 500));
            }
            if (!updated || (Array.isArray(updated) && updated.length === 0)) {
                console.error('No rows updated. id:', id, 'user_id:', user.id);
                return next(new errorHandler_1.AppError('No review updated (not found or not owned by user)', 404));
            }
            // Always use the first updated review (should only ever be one)
            const updatedReview = Array.isArray(updated) ? updated[0] : updated;
            // Fetch review after attempted update (optional, for logging)
            console.log('Fetching review after attempted update...');
            const { data: afterUpdate, error: afterUpdateError } = yield supabase
                .from('reviews')
                .select('*')
                .eq('id', id)
                .maybeSingle();
            if (afterUpdateError) {
                console.error('Error fetching review after update:', afterUpdateError);
            }
            console.log('Review after attempted update:', afterUpdate);
            console.log('--- updateReview controller completed successfully ---');
            res.status(200).json({ status: 'success', data: { message: 'Review updated successfully', updated: updatedReview, afterUpdate } });
        }
        catch (err) {
            console.error('Exception in updateReview:', err);
            next(new errorHandler_1.AppError('An error occurred while updating the review', 500));
        }
    }
    catch (err) {
        console.error('Outer exception in updateReview:', err);
        next(new errorHandler_1.AppError('An error occurred while updating the review', 500));
    }
});
exports.updateReview = updateReview;
