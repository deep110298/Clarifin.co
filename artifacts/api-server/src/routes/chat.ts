import { Router } from "express"
import type { Request, Response, NextFunction } from "express"
import { db } from "@workspace/db"
import { chatMessagesTable } from "@workspace/db/schema"
import { eq, asc } from "drizzle-orm"
import { requireAuth } from "../middleware/auth"

const router = Router()

// GET /api/chat — return recent chat history for the user (capped at 100 messages)
router.get("/chat", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.userId, req.clarifin!.userId))
      .orderBy(asc(chatMessagesTable.createdAt))
      .limit(100)
    res.json(messages)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/chat — clear chat history for the user
router.delete("/chat", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await db.delete(chatMessagesTable).where(eq(chatMessagesTable.userId, req.clarifin!.userId))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
