import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AuthRequest } from '../middleware/auth.middleware'
import { registerSchema } from '../lib/request.schema'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET!

export const register = async (req: Request, res: Response) => {
  try {
    // parse and coerce fields using Zod
    const parsed = registerSchema.parse({
      ...req.body,
      approver: req.body.approver, // "true" | "false" → boolean
      branchId: req.body.branchId, // "3" → number
    });

    const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const existingUsername = await prisma.user.findUnique({ where: { username: parsed.username } });
    if (existingUsername) return res.status(400).json({ message: "Username already exists" });

    // File is available via Multer
    const signatureUrl = req.file
      ? `${process.env.APP_URL}/uploads/${req.file.filename}`
      : null;

    const hashed = await bcrypt.hash(parsed.password, 10);

    const user = await prisma.user.create({
      data: {
        name: parsed.name.trim(),
        email: parsed.email.trim(),
        username: parsed.username.trim(),
        password: hashed,
        role: parsed.role,
        branchId: parsed.branchId ?? null,
        approver: parsed.approver,
        position: parsed.position,
        initial: parsed.initial,
        signatureUrl,
      },
    });

    res.status(201).json({
      message: "Account created",
      user: { id: user.id, email: user.email, name: user.name, approver: user.approver },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(400).json({ message: "Invalid data", error: err });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: 'Invalid credentials' })
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' })
    res.cookie('token', token, {
        httpOnly: true,
        secure: false, // set to true in production with HTTPS
        sameSite: 'lax',
        maxAge: 86400000,
    })
    res.json({ message: 'Login successful', user: { id: user.id, email: user.email, name: user.name } })
}

export const me = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    const user = await prisma.user.findUnique({ where: { id: userId },
    include: {
      branch: true,
    } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json({ 
      id: user.id, 
      email: user.email,
      name: user.name,
      role: user.role,
      branchId: user.branchId,
      branchName: user.branch?.branchName,
      signatureUrl: user.signatureUrl,
      position:user.position,
    })
}


  export const logout = (req: Request, res: Response) => {
    res.clearCookie('token', {
      httpOnly: true,
      secure: false, // change to true in production (HTTPS)
      sameSite: 'lax',
    })
  
    res.json({ message: 'Logged out successfully' })
  }


 
  export const listUsers = async (req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          branchId: true,
          initial: true,
          position: true,
          approver: true,
          signatureUrl: true,
          createdAt: true,
          updateAt: true,
          branch: true
        },
      });
  
      res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
