import { Router } from 'express'
import { z } from 'zod'
//Need to implement this through the middleware
import { supabase, type Database } from '../db'
import {makeCoffeePost} from '../controllers/posts'

const router = Router()

// Types from database
type Post = Database['public']['Tables']['post']['Row']

router.post('/', makeCoffeePost)

export default router
