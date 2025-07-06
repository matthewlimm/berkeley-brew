// Load environment variables first
import './config/env'
// Import environment variables (using require since it's a CommonJS export)
const env = require('./config/env')

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import errorHandler from './middleware/errorHandler'
import cafeRouter from './routes/cafes'
import postsRouter from './routes/posts'
import userRouter from './routes/users'
import placesRouter from './routes/places'
import bookmarksRouter from './routes/bookmarks'

// Create Express app
const app = express()

// Environment variables
const port = env?.PORT || process.env.PORT || 3001
const frontendUrl = env?.FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3000'
const isProduction = (env?.NODE_ENV || process.env.NODE_ENV) === 'production'
const maxRetries = 3
let currentPort = port

// Middleware
app.use(cors({
  origin: frontendUrl,
  credentials: true
}))
app.use(helmet())

// Only use morgan in development
if (!isProduction) {
  app.use(morgan('dev'))
}

app.use(express.json())

// Routes
app.use('/api/cafes', cafeRouter)
app.use('/api/posts', postsRouter)
app.use('/api/user', userRouter)
app.use('/api/places', placesRouter)
app.use('/api/bookmarks', bookmarksRouter)

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    environment: isProduction ? 'production' : 'development',
    timestamp: new Date().toISOString()
  })
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

// Function to start the server for local development
const startServer = async () => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(currentPort, () => {
          console.log(`🚀 API server running on port ${currentPort}`)
          console.log(`Frontend URL: ${frontendUrl}`)
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

// Start the server if running directly (not imported as a module)
if (require.main === module) {
  startServer()
}

// Export the Express app for Vercel serverless deployment
export default app