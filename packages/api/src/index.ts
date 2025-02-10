// Server setup concepts
// 1. Create Express app
// 2. Add middleware (like json parser)
// 3. Add routes
// 4. Add error handling
// 5. Start server on a port

// Common patterns to implement:
// - Environment variables for port
// - Basic logging
// - Error handling middleware
// - Health check endpoint

import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { errorHandler } from './middleware/errorHandler'
import cafeRouter from './routes/cafes'

const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

// Routes
app.use('/api/cafes', cafeRouter)

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy' })
})

// Error handling
app.use(errorHandler)

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found'
  })
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})