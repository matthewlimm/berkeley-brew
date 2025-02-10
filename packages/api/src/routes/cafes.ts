import { Router } from 'express'
import { z } from 'zod'
import { AppError } from '../middleware/errorHandler'

const router = Router()

// Validation schema for cafe ratings
const ratingSchema = z.object({
  goldenBearScore: z.number().min(0).max(5),
  grindability: z.number().min(0).max(5),
  radicalScore: z.number().min(0).max(5),
  vibes: z.number().min(0).max(5),
})

// GET /api/cafes
router.get('/', (req, res) => {
  // TODO: Implement fetching cafe from database
  res.json({
    status: 'success',
    data: {
      cafes: []
    }
  })
})

// GET /api/cafes/:id
router.get('/:id', (req, res, next) => {
  const { id } = req.params
  
  // TODO: Implement fetching a specific cafe
  // For now, return a 404 error as an example
  return next(new AppError('Cafe not found', 404))
})

// POST /api/cafes/:id/ratings
router.post('/:id/ratings', async (req, res, next) => {
  try {
    const validation = ratingSchema.safeParse(req.body)
    
    if (!validation.success) {
      return next(new AppError('Invalid rating data', 400))
    }

    // TODO: Implement saving ratings to database
    res.status(201).json({
      status: 'success',
      message: 'Rating saved successfully'
    })
  } catch (error) {
    next(error)
  }
})

export default router
