// Load environment variables first
import './config/env'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { errorHandler } from './middleware/errorHandler'
import cafeRouter from './routes/cafes'

const app = express()
const port = process.env.PORT || 3001 // Changed from 3000 to avoid conflict with Next.js

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

// Routes
app.use('/api/cafes', cafeRouter)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Error handling
app.use(errorHandler)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found'
  })
})

app.listen(port, () => {
  console.log(`🚀 API server running on port ${port}`)
})