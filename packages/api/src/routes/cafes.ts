import { Router } from 'express'
import { z } from 'zod'
import { supabase, type Database } from '../db'
import { getAllCafes, getCafeById, addCafeReview } from '../controllers/cafes'
import { requireAuth } from '../middleware/auth'

const router = Router()

// Types from database
type Cafe = Database['public']['Tables']['cafes']['Row']
type Review = Database['public']['Tables']['reviews']['Row']

// Public routes
router.get('/', getAllCafes)
router.get('/:id', getCafeById)

// Protected routes - require authentication
router.post('/:id/reviews', requireAuth, addCafeReview)

export default router
