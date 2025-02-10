import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  statusCode: number
  status: string

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    })
  }

  // Handle unexpected errors
  console.error('Error:', err)
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong',
  })
}
