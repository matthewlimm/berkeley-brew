import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { updateReview } from '../controllers/reviews';

const router = Router();

// PATCH /api/reviews/:id - update a review (authenticated)
router.patch('/:id', requireAuth, updateReview);

export default router;
