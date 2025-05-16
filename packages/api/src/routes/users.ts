import express from 'express';
import { getCurrentUser, updateUserProfile, getUserReviews } from '../controllers/users';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// All user routes require authentication
router.use(requireAuth);

// Get current user profile
router.get('/profile', getCurrentUser);

// Update current user profile
router.patch('/profile', updateUserProfile);

// Get user reviews
router.get('/reviews', getUserReviews);

export default router;
