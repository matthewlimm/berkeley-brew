"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPosts = exports.deletePost = exports.makeCoffeePost = void 0;
const zod_1 = require("zod");
const db_1 = require("../db");
const errorHandler_1 = require("../middleware/errorHandler");
// Validation schema for posts
const postSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    content: zod_1.z.string().min(1),
    type: zod_1.z.enum(['recipe', 'guide']),
    brew_method: zod_1.z.string().min(1),
    difficulty_level: zod_1.z.number().min(0).max(5),
    prep_time: zod_1.z.number(),
    ingredients: zod_1.z.array(zod_1.z.string()).optional()
});
const getAllPosts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data: posts, error } = yield db_1.supabase
            .from('posts')
            .select(`
        id, 
        title, 
        content, 
        type, 
        brew_method,
        difficulty_level,
        ingredients,
        author_id,
        created_at,
        updated_at
        `);
        if (error) {
            return next(new errorHandler_1.AppError('Failed to fetch posts:' + error.message, 500));
        }
        if (!posts) {
            return next(new errorHandler_1.AppError('No posts found', 404));
        }
        res.status(200).json({
            status: 'success',
            data: {
                posts
            }
        });
    }
    catch (err) {
        next(new errorHandler_1.AppError('An error occurred while fetching posts', 500));
    }
});
exports.getAllPosts = getAllPosts;
const deletePost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            return next(new errorHandler_1.AppError('Invalid ID', 400));
        }
        const { data: { user }, error: authError } = yield db_1.supabase.auth.getUser();
        if (authError || !user) {
            return next(new errorHandler_1.AppError('Authentication required', 401));
        }
        //delete user using the ID
        const { data: post, error: postError } = yield db_1.supabase
            .from('posts')
            .delete()
            .eq('id', id);
        if (postError) {
            return next(new errorHandler_1.AppError('Failed to delete post: ' + postError.message, 500));
        }
        res.status(201).json({
            status: 'success'
        });
    }
    catch (err) {
        return next(new errorHandler_1.AppError('Error deleting post: ', 500));
    }
});
exports.deletePost = deletePost;
const makeCoffeePost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate request body
        const validation = postSchema.safeParse(req.body);
        if (!validation.success) {
            return next(new errorHandler_1.AppError('Invalid post data: ' + validation.error.message, 400));
        }
        const { title, content, type, brew_method, difficulty_level, prep_time, ingredients } = validation.data;
        // Get user ID from Supabase auth context
        const { data: { user }, error: authError } = yield db_1.supabase.auth.getUser();
        if (authError || !user) {
            return next(new errorHandler_1.AppError('Authentication required', 401));
        }
        // Insert post
        const { data: post, error: postError } = yield db_1.supabase
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
            .single();
        if (postError) {
            return next(new errorHandler_1.AppError('Failed to create post: ' + postError.message, 500));
        }
        res.status(201).json({
            status: 'success',
            data: { post }
        });
    }
    catch (err) {
        next(new errorHandler_1.AppError('An error occurred while creating the post', 500));
    }
});
exports.makeCoffeePost = makeCoffeePost;
