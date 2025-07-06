"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
const path_1 = __importDefault(require("path"));

// Try to load environment variables from .env file, but don't fail if not found
// This allows the app to use environment variables set in Vercel dashboard
try {
    const result = (0, dotenv_1.config)({
        path: path_1.default.resolve(__dirname, '../../../../.env')
    });
    
    if (result.parsed) {
        console.log('Environment loaded from .env file:', Object.keys(result.parsed).length + ' variables');
    } else {
        console.log('No .env file found or empty, using system environment variables');
    }
} catch (error) {
    console.log('Could not load .env file, using system environment variables');
}
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).default('3002'),
    SUPABASE_URL: zod_1.z.string().default(process.env.NEXT_PUBLIC_SUPABASE_URL || ''),
    SUPABASE_ANON_KEY: zod_1.z.string().optional().default(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''),
    FRONTEND_URL: zod_1.z.string().default(process.env.FRONTEND_URL || 'http://localhost:3000')
});

// Export the validated environment variables
let env;

try {
    env = envSchema.parse(process.env);
    console.log('✓ Environment variables validated');
    
    // Log environment info but protect sensitive values
    console.log('Environment info:', {
        NODE_ENV: env.NODE_ENV,
        PORT: env.PORT,
        SUPABASE_URL: env.SUPABASE_URL,
        SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY ? env.SUPABASE_ANON_KEY.slice(0, 5) + '...' : 'not set',
        FRONTEND_URL: env.FRONTEND_URL
    });
} catch (error) {
    if (error instanceof zod_1.z.ZodError) {
        console.error('❌ Environment validation errors:', JSON.stringify(error.errors, null, 2));
        
        // In production, try to continue with defaults instead of crashing
        if (process.env.NODE_ENV === 'production') {
            console.warn('Continuing with available environment variables in production mode');
            env = {
                NODE_ENV: process.env.NODE_ENV || 'production',
                PORT: parseInt(process.env.PORT || '3002', 10),
                SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
                SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                FRONTEND_URL: process.env.FRONTEND_URL || ''
            };
        } else {
            // Only exit in development to enforce proper setup
            process.exit(1);
        }
    }
}

// Export the environment variables
module.exports = env;
