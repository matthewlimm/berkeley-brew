import dotenv from 'dotenv'
import { resolve } from 'path'
import { z } from 'zod'

// Load environment variables from root .env
dotenv.config({ path: resolve(__dirname, '../../../../.env') })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  FRONTEND_URL: z.string().url().default('http://localhost:3000')
})

try {
  envSchema.parse(process.env)
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
