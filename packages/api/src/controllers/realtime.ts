import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod'
import { supabase, type Database } from '../db'
import { AppError } from '../middleware/errorHandler'
import { selectFields } from 'express-validator/lib/field-selection';
import { subMinutes } from 'date-fns';
import { inflateRaw } from 'zlib';


type Cafe = Database['public']['Tables']['cafes']['Row']
type RealTime = Database['public']['Tables']['cafes_realtime_data']['Row']
type quantity = Database['public']['Enums']['amenity_type']

export const qualityTypeSchema = z.enum(['wifi_availability', 'outlet_availability', 'seating']);
export const amenityTypeSchema = z.enum(['low', 'medium', 'high']);

//Validaton schema for realtime data input objects
const realSchema = z.object({
    cafe_id: z.string().uuid(),
    user_id: z.string().uuid(),
    type: amenityTypeSchema,
    value: amenityTypeSchema
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

        const {cafe_id, user_id, type, value} = validation.data
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

        try {
            //service-role but not RLS
            const token = req.headers.authorization?.split(' ')[1] || '';
            //need to create a new client
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

            //anonymous client with authorization
            const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            })

            //verify session is valid
            const { data: authData, error: authError } = await anonClient.auth.getUser();

            if (authError) {
                console.error('Auth session error:', authError);
                return next(new AppError('Authentication error: ' + authError.message, 401));
            }


            console.log('Auth user verified successfully:', !!authData.user);
            const { error } = await anonClient
                .from('cafes_realtime_data')
                .insert({
                    cafe_id: cafeId,
                    user_id: user.id,
                    type: type,
                    value: value
                }) 
        }
    
        // can finally update realtime data, which I first have to extract and then take the weighted average of
        // gte = greater or equal to
        // need to figure out a way to aggregate later
        const timeLimit = subMinutes(new Date(), 60) // last hour
        const {data: mostRecent, error: dataError} = await supabase 
        .from('cafes_realtime_data')
        .select(`
        type,
        value
        `)
        .eq('cafe_id', cafeId)
        .gte('created_at', timeLimit.toISOString())

        if (dataError) {
            return next(new AppError('realtime data not found', 404))
        }

        const result = {
            wifi_availability: 0,
            outlet_availability: 0,
            seating: 0
        }



        mostRecent.forEach((item) => {
            switch (item.type) {
                case ("wifi_availability"):
                    if (item.value == 'high') {
                        result["wifi_availability"] = result["wifi_availability"] + 1
                    }
                    else if (item.value == 'low') {
                        result["wifi_availability"] = result["wifi_availability"] - 1
                    }
                    
                case ("outlet_availability"):
                    if (item.value == 'high') {
                        result["outlet_availability"] = result["outlet_availability"] + 1
                    }
                    else if (item.value == 'low') {
                        result["outlet_availability"] = result["outlet_availability"] - 1
                    }
                case ("seating"):
                    if (item.value == 'high') {
                        result["seating"] = result["seating"] + 1
                    }
                    else if (item.value == 'low') {
                        result["seating"] = result["seating"] - 1
                    }
            }
        })

        


         
       
    }
}