import { Router } from 'express'
import { z } from 'zod'
//Need to implement this through the middleware
import { supabase, type Database } from '../db'
import { addPost } from '../controllers/posts'

const router = Router()

// Types from database
type Post = Database['public']['Tables']['posts']['Row']

router.post('/', addPost)

export default router
