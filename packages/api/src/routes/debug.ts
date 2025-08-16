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

// Debug endpoint to test cafe score update
router.get('/test-cafe-update/:cafeId', async (req, res) => {
    try {
        const { cafeId } = req.params;
        const { serviceRoleClient } = await import('../db');
        
        console.log('=== PRODUCTION DEBUG: Testing cafe update ===');
        console.log('Cafe ID:', cafeId);
        
        // Test simple update
        const { error: testError, count: testCount } = await serviceRoleClient
            .from('cafes')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', cafeId);
            
        console.log('Test update - Error:', testError, 'Count:', testCount);
        
        // Test score update
        const { error: scoreError, count: scoreCount } = await serviceRoleClient
            .from('cafes')
            .update({ 
                grindability_score: 4.5,
                golden_bear_score: 4.0,
                updated_at: new Date().toISOString()
            })
            .eq('id', cafeId);
            
        console.log('Score update - Error:', scoreError, 'Count:', scoreCount);
        
        res.json({
            cafeId,
            testUpdate: { error: testError, count: testCount },
            scoreUpdate: { error: scoreError, count: scoreCount }
        });
        
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({ error: String(error) });
    }
});

export default router;
