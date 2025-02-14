import { Router } from 'express'
import { z } from 'zod'
//Need to implement this through the middleware
import { supabase, type Database } from '../db'
import {getAllCafes, getCafeByid, cafeReviews} from '../controllers/cafes'

const router = Router()

// Types from database
type Cafe = Database['public']['Tables']['cafes']['Row']
type Review = Database['public']['Tables']['reviews']['Row']

router.get('/', getAllCafes)
router.get('/:id', getCafeByid)
router.post('/:id/reviews', cafeReviews)

export default router
