import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod'
import { supabase, type Database } from '../db'
import { AppError } from '../middleware/errorHandler'
import { selectFields } from 'express-validator/lib/field-selection';
import { subMinutes } from 'date-fns';


type Cafe = Database['public']['Tables']['cafes']['Row']
type RealTime = Database['public']['Tables']['cafes_realtime_data']['Row']
type quantity = Database['public']['Enums']['amenity_type']

export const amenityTypeSchema = z.enum(['low', 'medium', 'high']);

//Validaton schema for realtime data input objects
const realSchema = z.object({
    cafe_id: z.string().uuid(),
    user_id: z.string().uuid(),
    amenity_type: amenityTypeSchema,
})

const getDataByCafe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id} = req.params
        const { data: rt, error } = await supabase
            .from('cafes_realtime_data')
            .select(`
                cafe_id,
                user_id,
                ameenity_type
            `)
            .eq('cafe_id', id)
            .single()

        if (error) {
            return next(new AppError('Failed to fetch cafes: ' + error.message, 500))
        }

        if (!rt) {
            return next(new AppError('No cafes found', 404))
        }

        res.status(200).json({
            status: 'success',
            data: {
                data: rt
            }
        })
        
    }
    catch (err) {
        next(new AppError('An error occurred while fetching cafes', 500))
    }
}

const postRealtime = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id: cafeId} = req.params
        const validation = realSchema.safeParse(req.body)

        if (!validation.success) {
            return next(new AppError('Invalid review data: ' + validation.error.message, 400))
        }

        const {cafe_id, user_id, amenity_type} = validation.data
        //so the steps are to first validate the request with the validation schema
        //then we want to set the data and verify the user
        const user = req.user
        if (!user) {
            return next(new AppError('Authentication required', 401))
        }
        
        //use this to check for the cafe id if it exists
        const {data: checker, error: realtimeError} = await supabase
        .from('cafes_realtime_data')
        .select('cafe_id')
        .eq('cafe_id', cafeId)
        .single()

        if (realtimeError || !checker) {
            return next(new AppError('Cafe not found', 404))
        }

        //now we also want to do a check for existing realtime data, which we would like to update
        
        //1: verify user exists
        const {data: existingUser, error: userCheck} = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()
        
        if (!existingUser) {
            const {error: createUserError} = await supabase 
            .from('users')
            .insert({
                id: user.id,
                username: user.email?.split('@')[0] || 'user',
                email: user.email
            })

            if (createUserError) {
                return next(new AppError('Failed to create user profile: ' + createUserError.message, 500));
            }
        }

        //can finally update realtime data, which I first have to extract and then take the weighted average of

        


    }
}