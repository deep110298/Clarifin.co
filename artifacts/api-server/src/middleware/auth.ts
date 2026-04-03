import { clerkMiddleware, getAuth } from "@clerk/express"
import type { Request, Response, NextFunction } from "express"
import { db } from "@workspace/db"
import { usersTable } from "@workspace/db/schema"
import { eq } from "drizzle-orm"

export { clerkMiddleware }

// Extend Express Request with clarifin user context
declare global {
  namespace Express {
    interface Request {
      clarifin?: { userId: string; plan: string }
    }
  }
}

// requireAuth: verifies Clerk JWT and syncs/loads the DB user
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req)
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  try {
    let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId))
    if (!user) {
      // Auto-provision user on first API call (belt-and-suspenders beyond webhook)
      const email = (req as Request & { auth?: { sessionClaims?: { email?: string } } })
        .auth?.sessionClaims?.email ?? `${userId}@unknown.clarifin`
      ;[user] = await db.insert(usersTable).values({ clerkId: userId, email, plan: "free" }).returning()
    }
    req.clarifin = { userId: user.id, plan: user.plan }
    next()
  } catch (err) {
    next(err)
  }
}
