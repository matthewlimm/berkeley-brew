import { Router } from 'express'
import { z } from 'zod'
import { supabase, type Database } from '../db'
import { requireAuth } from '../middleware/auth'
import {getDataByCafe,postRealtime } from '../controllers/realtime'

const router = Router()

type Cafe = Database['public']['Tables']['cafes']['Row']
type RealTime = Database['public']['Tables']['cafes_realtime_data']['Row']

router.get('/:id', getDataByCafe)
router.post('/:id/popup', postRealtime)

export default router

