"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabasePublic = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase URL or Service Role Key in environment variables');
}
// Create client with service role key to bypass RLS policies
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
// Create a client with anon key for operations that should respect RLS
exports.supabasePublic = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
