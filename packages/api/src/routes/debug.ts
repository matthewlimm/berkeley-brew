import { Router } from 'express';

const router = Router();

// Debug endpoint to check environment variables (remove after debugging)
router.get('/env-check', (req, res) => {
    res.json({
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_URL_starts: process.env.SUPABASE_URL?.substring(0, 30) + '...',
        NODE_ENV: process.env.NODE_ENV
    });
});

export default router;
