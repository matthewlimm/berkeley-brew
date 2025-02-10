import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from root .env
dotenv.config({ path: resolve(__dirname, '../../../../.env') })
