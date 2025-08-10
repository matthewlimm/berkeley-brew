"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceRoleClient = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}
// Regular client with anonymous key (subject to RLS policies)
exports.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
// Service role client that bypasses RLS policies
// Note: In production, you should store the service role key securely
exports.serviceRoleClient = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : exports.supabase; // Fallback to regular client if no service role key is available
