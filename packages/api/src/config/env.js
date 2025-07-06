"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
const path_1 = __importDefault(require("path"));
// Load environment variables from root directory
const result = (0, dotenv_1.config)({
    path: path_1.default.resolve(__dirname, '../../../../.env')
});
if (result.error) {
    console.error('❌ Error loading .env file:', result.error);
    process.exit(1);
}
console.log('Environment loaded from:', result.parsed ? Object.keys(result.parsed).length + ' variables' : 'no variables found');
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).default('3002'), // Changed to 3002
    SUPABASE_URL: zod_1.z.string(),
    SUPABASE_ANON_KEY: zod_1.z.string().optional(), // Made optional for now
    FRONTEND_URL: zod_1.z.string().default('http://localhost:3000')
});
try {
    const env = envSchema.parse(process.env);
    console.log('✓ Environment variables validated');
    if (env.SUPABASE_ANON_KEY) {
        console.log('Debug:', {
            SUPABASE_URL: env.SUPABASE_URL,
            SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY.slice(0, 10) + '...'
        });
    }
    else {
        console.log('Warning: SUPABASE_ANON_KEY is not set');
    }
}
catch (error) {
    if (error instanceof zod_1.z.ZodError) {
        console.error('❌ Invalid environment variables:', JSON.stringify(error.errors, null, 2));
        process.exit(1);
    }
}
