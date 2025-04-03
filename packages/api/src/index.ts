// Load environment variables first
import './config/env'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import errorHandler from './middleware/errorHandler'
import cafeRouter from './routes/cafes'

const app = express()
const port = process.env.PORT || '3001'
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
        const server = app.listen(currentPort as number, () => {
          console.log(`🚀 API server running on port ${currentPort}`)
          resolve(true)
        })
        
        server.on('error', (error: any) => {
          if (error.code === 'EADDRINUSE') {
            const nextPort = parseInt(currentPort as string) + 1
            console.log(`Port ${currentPort} is in use, trying ${nextPort}`)
            currentPort = nextPort.toString()
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