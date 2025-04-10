import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod'
import { supabase, type Database } from '../db'
import { AppError } from '../middleware/errorHandler';

type Post = Database['public']['Tables']['posts']['Row']

// Validation schema for posts
const postSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    type: z.enum(['recipe', 'guide']),
    brew_method: z.string().min(1),
    difficulty_level: z.number().min(0).max(5),
    prep_time: z.number(), 
    ingredients: z.array(z.string()).optional()
})

const deletePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id} = req.params
        if (!id) {
            return next(new AppError('Invalid ID', 400))
        }
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return next(new AppError('Authentication required', 401))
        }

        //delete user using the ID
        const {data: post, error: postError} = await supabase 
            .from('posts')
            .delete()
            .eq('id',id)

        if (postError) {
            return next(new AppError('Failed to delete post: ' + postError.message, 500))
        }
        res.status(201).json({
            status: 'success'
        })
    } catch (err) {
        return next(new AppError('Error deleting post: ', 500))

    }
}

const makeCoffeePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate request body
        const validation = postSchema.safeParse(req.body)
        if (!validation.success) {
            return next(new AppError('Invalid post data: ' + validation.error.message, 400))
        }

        const { title, content, type, brew_method, difficulty_level, prep_time, ingredients } = validation.data
        
        // Get user ID from Supabase auth context
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return next(new AppError('Authentication required', 401))
        }

        // Insert post
        const { data: post, error: postError } = await supabase 
            .from('posts')
            .insert({
                title, 
                content, 
                type, 
                brew_method,
                difficulty_level, 
                prep_time, 
                ingredients: ingredients || null, 
                author_id: user.id
            })
            .select()
            .single()

        if (postError) {
            return next(new AppError('Failed to create post: ' + postError.message, 500))
        }

        res.status(201).json({
            status: 'success',
            data: { post }
        })
    } catch (err) {
        next(new AppError('An error occurred while creating the post', 500))
    }
}



export { makeCoffeePost, deletePost }
