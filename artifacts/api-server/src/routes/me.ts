import { Router } from "express"
import type { Request, Response, NextFunction } from "express"
import { db } from "@workspace/db"
import { usersTable, profilesTable } from "@workspace/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "../middleware/auth"

const router = Router()

router.get("/me", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.clarifin!.userId))
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.clarifin!.userId))
    res.json({ ...user, profileComplete: profile?.isComplete ?? false })
  } catch (err) {
    next(err)
  }
})

export default router
