import { Router } from "express"
import type { Request, Response, NextFunction } from "express"
import { db } from "@workspace/db"
import { profilesTable } from "@workspace/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "../middleware/auth"
import { z } from "zod"

const router = Router()

const profileBodySchema = z.object({
  grossIncome: z.number().min(0),
  filingStatus: z.enum(["single", "married", "head"]),
  state: z.string().length(2),
  age: z.number().min(16).max(100),
  expenses: z.object({
    housing: z.number().min(0),
    transport: z.number().min(0),
    food: z.number().min(0),
    utilities: z.number().min(0),
    healthcare: z.number().min(0),
    other: z.number().min(0),
  }),
  savings: z.object({
    emergency: z.number().min(0),
    retirement: z.number().min(0),
    monthlyContrib: z.number().min(0),
    investments: z.number().min(0),
  }),
  debt: z.object({
    creditCard: z.number().min(0),
    studentLoans: z.number().min(0),
    carLoans: z.number().min(0),
    other: z.number().min(0),
  }),
  isComplete: z.boolean().optional(),
})

// GET /api/profile — get current user's profile
router.get("/profile", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.clarifin!.userId))
    if (!profile) {
      res.json(null)
      return
    }
    res.json(profile)
  } catch (err) {
    next(err)
  }
})

// PUT /api/profile — create or update profile
router.put("/profile", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const parsed = profileBodySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid profile data", details: parsed.error.flatten() })
    return
  }

  try {
    const data = { ...parsed.data, userId: req.clarifin!.userId, isComplete: true }
    const [profile] = await db.insert(profilesTable)
      .values(data)
      .onConflictDoUpdate({ target: profilesTable.userId, set: { ...data, updatedAt: new Date() } })
      .returning()
    res.json(profile)
  } catch (err) {
    next(err)
  }
})

export default router
