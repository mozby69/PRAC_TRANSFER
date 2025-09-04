import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export interface AuthRequest extends Request {
  user?: { id: number }
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ message: 'Unauthorized: No token' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number }
    req.user = { id: decoded.id }
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' })
  }
}
