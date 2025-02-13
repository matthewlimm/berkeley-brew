import { Router } from 'express'
import { z } from 'zod'
import { supabase, type Database } from '../db'
import { getAllCafes, getCafeByid, cafeReviews } from '../controllers/cafes'

const router = Router()

// Types from database
type Cafe = Database['public']['Tables']['cafes']['Row']
type Review = Database['public']['Tables']['reviews']['Row']

// Routes are mounted at /api/cafes, so we use relative paths here
router.get('/', getAllCafes)
router.get('/:id', getCafeByid)
router.post('/:id/reviews', cafeReviews)

export default router
