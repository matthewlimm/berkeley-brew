import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../db';
import { AppError } from '../middleware/errorHandler';

const reviewUpdateSchema = z.object({
  content: z.string().min(1),
  grindability_score: z.number().min(0).max(5),
  student_friendliness_score: z.number().min(0).max(5),
  coffee_quality_score: z.number().min(0).max(5),
  vibe_score: z.number().min(0).max(5),
});

// PATCH /api/reviews/:id
export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const user = req.user;
  
  // Validate authentication
  if (!user) {
    console.error('No user found in request.');
    return next(new AppError('Authentication required', 401));
  }

  // Extract user's JWT from Authorization header
  const userAccessToken = req.headers.authorization?.split(' ')[1];
  
  // Create a per-request Supabase client with the user's JWT for RLS
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${userAccessToken}`
        }
      }
    }
  );

  // Debug: print current auth user id
  console.log('Current auth user.id:', user.id);
  console.log('--- updateReview controller invoked ---');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  console.log('User from request:', user);

  try {
      // Validate input
      console.log('Validating input...');
      const validation = reviewUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        console.error('Validation failed:', validation.error);
        return next(new AppError('Invalid input', 400));
      }
      console.log('Validation succeeded:', validation.data);
      // Check review exists and belongs to user
      console.log('Fetching review to check ownership...');
      const { data: review, error: reviewError } = await supabase
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
        return next(new AppError('Review not found or not owned by user', 404));
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
      const { data: updated, error: updateError } = await supabase
        .from('reviews')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*');
      console.log('Review update result:', updated, updateError);
      if (updateError) {
        console.error('Error during update:', updateError);
        return next(new AppError('Failed to update review: ' + updateError.message, 500));
      }
      if (!updated || (Array.isArray(updated) && updated.length === 0)) {
        console.error('No rows updated. id:', id, 'user_id:', user.id);
        return next(new AppError('No review updated (not found or not owned by user)', 404));
      }
      // Always use the first updated review (should only ever be one)
      const updatedReview = Array.isArray(updated) ? updated[0] : updated;
      // Fetch review after attempted update (optional, for logging)
      console.log('Fetching review after attempted update...');
      const { data: afterUpdate, error: afterUpdateError } = await supabase
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
    } catch (err) {
      console.error('Exception in updateReview:', err);
      next(new AppError('An error occurred while updating the review', 500));
    }
  }
