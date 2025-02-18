import { Router } from 'express'
import { z } from 'zod'
import { supabase, type Database } from '../db'
import { getAllCafes, getCafeById, addCafeReview } from '../controllers/cafes'

const router = Router()

// Types from database
type Cafe = Database['public']['Tables']['cafes']['Row']
type Review = Database['public']['Tables']['reviews']['Row']

router.get('/', getAllCafes)
router.get('/:id', getCafeById)
router.post('/:id/reviews', addCafeReview)

export default router
