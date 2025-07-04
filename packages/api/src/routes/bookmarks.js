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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabase_js_1 = require("@supabase/supabase-js");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Helper function to create a Supabase client with JWT token
const createSupabaseClientWithToken = (token) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    });
};
// Get all bookmarks for the authenticated user
router.get('/', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Ensure we have a valid user ID
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'User authentication required' });
        }
        // Get the auth token from the request
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        if (!token) {
            return res.status(401).json({ error: 'Valid authentication token required' });
        }
        const userId = req.user.id;
        // Create a new Supabase client with the user's token
        const supabaseWithAuth = createSupabaseClientWithToken(token);
        // Check if reviews should be included
        const includeReviews = req.query.includeReviews === 'true';
        let selectQuery = '*, cafes(*)';
        if (includeReviews) {
            selectQuery = `*, cafes(
        id,
        name,
        address,
        created_at,
        updated_at,
        image_url,
        grindability_score,
        student_friendliness_score,
        coffee_quality_score,
        vibe_score,
        golden_bear_score,
        price_category,
        latitude,
        longitude,
        popular_times,
        popular_times_updated_at,
        place_id,
        business_hours,
        reviews (
          grindability_score,
          student_friendliness_score,
          coffee_quality_score,
          vibe_score,
          golden_bear_score
        )
      )`;
        }
        const { data, error } = yield supabaseWithAuth
            .from('bookmarks')
            .select(selectQuery)
            .eq('user_id', userId);
        if (error)
            throw error;
        // If reviews are included, calculate average ratings
        if (includeReviews && data) {
            const bookmarksWithAvgRating = data.map((bookmark) => {
                if (bookmark.cafes && bookmark.cafes.reviews) {
                    const reviews = bookmark.cafes.reviews.filter((r) => r && r.golden_bear_score !== undefined);
                    const avgRating = reviews.length > 0
                        ? reviews.reduce((sum, r) => sum + Number(r.golden_bear_score), 0) / reviews.length
                        : null;
                    return Object.assign(Object.assign({}, bookmark), { cafes: Object.assign(Object.assign({}, bookmark.cafes), { average_rating: avgRating, review_count: reviews.length }) });
                }
                return bookmark;
            });
            return res.status(200).json(bookmarksWithAvgRating);
        }
        return res.status(200).json(data);
    }
    catch (error) {
        console.error('Error fetching bookmarks:', error);
        return res.status(500).json({ error: error.message });
    }
}));
// Add a bookmark
router.post('/', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cafe_id } = req.body;
        if (!cafe_id) {
            return res.status(400).json({ error: 'Cafe ID is required' });
        }
        // Ensure we have a valid user ID and token
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'User authentication required' });
        }
        // Get the auth token from the request
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        if (!token) {
            return res.status(401).json({ error: 'Valid authentication token required' });
        }
        const userId = req.user.id;
        console.log('Adding bookmark for user:', userId, 'cafe:', cafe_id);
        // Create a new Supabase client with the user's token
        const supabaseWithAuth = createSupabaseClientWithToken(token);
        // Insert bookmark using the authenticated client
        const { data, error } = yield supabaseWithAuth
            .from('bookmarks')
            .insert({
            user_id: userId,
            cafe_id
        })
            .select();
        if (error) {
            // If the error is a duplicate bookmark, return a friendly message
            if (error.code === '23505') {
                return res.status(409).json({ error: 'You have already bookmarked this cafe' });
            }
            throw error;
        }
        return res.status(201).json(data[0]);
    }
    catch (error) {
        console.error('Error adding bookmark:', error);
        return res.status(500).json({ error: error.message });
    }
}));
// Check if a cafe is bookmarked by the user
router.get('/check/:cafeId', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cafeId } = req.params;
        // Ensure we have a valid user ID
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'User authentication required' });
        }
        // Get the auth token from the request
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        if (!token) {
            return res.status(401).json({ error: 'Valid authentication token required' });
        }
        const userId = req.user.id;
        // Create a new Supabase client with the user's token
        const supabaseWithAuth = createSupabaseClientWithToken(token);
        const { data, error } = yield supabaseWithAuth
            .from('bookmarks')
            .select('id')
            .eq('user_id', userId)
            .eq('cafe_id', cafeId)
            .maybeSingle();
        if (error)
            throw error;
        return res.status(200).json({ isBookmarked: !!data });
    }
    catch (error) {
        console.error('Error checking bookmark:', error);
        return res.status(500).json({ error: error.message });
    }
}));
// Delete a bookmark
router.delete('/:cafeId', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cafeId } = req.params;
        // Ensure we have a valid user ID
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'User authentication required' });
        }
        // Get the auth token from the request
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        if (!token) {
            return res.status(401).json({ error: 'Valid authentication token required' });
        }
        const userId = req.user.id;
        // Create a new Supabase client with the user's token
        const supabaseWithAuth = createSupabaseClientWithToken(token);
        const { error } = yield supabaseWithAuth
            .from('bookmarks')
            .delete()
            .eq('user_id', userId)
            .eq('cafe_id', cafeId);
        if (error)
            throw error;
        return res.status(200).json({ message: 'Bookmark removed successfully' });
    }
    catch (error) {
        console.error('Error removing bookmark:', error);
        return res.status(500).json({ error: error.message });
    }
}));
exports.default = router;
