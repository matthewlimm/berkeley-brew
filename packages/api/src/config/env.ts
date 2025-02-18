import { config } from 'dotenv'
import { z } from 'zod'

// Load environment variables
const result = config()

if (result.error) {
  console.error('❌ Error loading .env file:', result.error)
  process.exit(1)
}

console.log('Environment loaded from:', result.parsed ? Object.keys(result.parsed).length + ' variables' : 'no variables found')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3002'),  // Changed to 3002
  SUPABASE_URL: z.string(),
  SUPABASE_ANON_KEY: z.string(),
  FRONTEND_URL: z.string().default('http://localhost:3000')
})

try {
  const env = envSchema.parse(process.env)
  console.log('✓ Environment variables validated')
  console.log('Debug:', {
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY.slice(0, 10) + '...'
  })
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:', JSON.stringify(error.errors, null, 2))
    process.exit(1)
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
