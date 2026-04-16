import { Router } from "express"
import type { Request, Response, NextFunction } from "express"
import { db } from "@workspace/db"
import { profilesTable } from "@workspace/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "../middleware/auth"
import { z } from "zod"

const router = Router()

const MAX_DOLLAR = 100_000_000 // $100M — reasonable upper bound to block absurd values

const dollar = z.number().finite().min(0).max(MAX_DOLLAR)

const profileBodySchema = z.object({
  grossIncome: dollar,
  filingStatus: z.enum(["single", "married", "head"]),
  state: z.string().length(2).regex(/^[A-Z]{2}$/),
  age: z.number().int().min(16).max(100),
  expenses: z.object({
    housing: dollar,
    transport: dollar,
    food: dollar,
    utilities: dollar,
    healthcare: dollar,
    other: dollar,
  }),
  savings: z.object({
    emergency: dollar,
    retirement: dollar,
    annual401k: dollar.optional().default(0),
    rothIra: dollar.optional().default(0),
    investments: dollar,
  }),
  debt: z.object({
    creditCard: dollar,
    studentLoans: dollar,
    carLoans: dollar,
    other: dollar,
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
    const data = {
      ...parsed.data,
      userId: req.clarifin!.userId,
      isComplete: true,
      annual401kContrib: parsed.data.savings.annual401k ?? 0,
      annualRothIraContrib: parsed.data.savings.rothIra ?? 0,
    }
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
