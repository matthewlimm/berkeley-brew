import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod'
import { supabase, type Database } from '../db'
import AppError from '../middleware/errorHandler';
import { validationResult } from 'express-validator';

//can check this later with matt
const app = express();
type coffeePost = Database['public']['Tables']['coffee_posts']['Row']


//need to make a validation schema for posts
const postSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    brew_method: z.string().min(1),
    difficulty_level: z.number().min(0).max(5),
    prep_time: z.number(), 
    ingredients: z.array(z.string()).optional()
})


const makeCoffeePost = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const validation = postSchema.safeParse(req.body)
        if (!validation.success) {
            return next(new AppError('Invalid post data', 400))
        }

        const {id: coffee_id} = req.params
        const {title, content, brew_method, difficulty_level, prep_time, ingredients} = validation.data
        
        const user_id = req.user?.id
        if (!user_id) {
            return next(new AppError('Authentication required', 401))
        }

        const {error: postingError} = await supabase 
        .from('coffeePost')
        .insert({
            user_id, 
            title, 
            content, 
            brew_method,
            difficulty_level, 
            prep_time, 
            ingredients
        })   

        if (postingError) {
          return next(new AppError(`Failed to create review: ${postingError.message}`, 500))
        }

        res.status(201).json({
            status: 'success', 
            message: 'post created with no issues'
        })
    }
    catch (error) {
        next(error)
    }
}


export {makeCoffeePost}