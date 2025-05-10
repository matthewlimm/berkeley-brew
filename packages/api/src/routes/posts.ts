import { Router } from 'express'
import { z } from 'zod'
//Need to implement this through the middleware
import { supabase, type Database } from '../db'
import { makeCoffeePost, getAllPosts } from '../controllers/posts'

const router = Router()

// Types from database
type Post = Database['public']['Tables']['posts']['Row']

router.post('/:id/post', makeCoffeePost)
router.get('/', getAllPosts)
// router.get('/:id', getP)

export default router
