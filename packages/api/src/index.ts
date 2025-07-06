// Load environment variables first
import './config/env'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import errorHandler from './middleware/errorHandler'
import cafeRouter from './routes/cafes'
import userRouter from './routes/users'
import placesRouter from './routes/places'
import bookmarksRouter from './routes/bookmarks'

const app = express()
const port = 3001 // Fixed port for API server
const maxRetries = 3
let currentPort = port

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
app.use('/api/user', userRouter)
app.use('/api/places', placesRouter)
app.use('/api/bookmarks', bookmarksRouter)

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

const startServer = async () => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(currentPort, () => {
          console.log(`🚀 API server running on port ${currentPort}`)
          resolve(true)
        })
        
        server.on('error', (error: any) => {
          if (error.code === 'EADDRINUSE') {
            const nextPort = currentPort + 1
            console.log(`Port ${currentPort} is in use, trying ${nextPort}`)
            currentPort = nextPort
            server.close()
            reject(error)
          } else {
            reject(error)
          }
        })
      })
      return // Server started successfully
    } catch (error) {
      if (attempt === maxRetries - 1) {
        console.error(`Failed to start server after ${maxRetries} attempts`)
        process.exit(1)
      }
      // Continue to next attempt
    }
  }
}

startServer()