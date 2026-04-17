import { createClient } from "@supabase/supabase-js"
import type { Request, Response, NextFunction } from "express"
import { db } from "@workspace/db"
import { usersTable } from "@workspace/db/schema"
import { eq } from "drizzle-orm"

// Service role client — server-side only, never exposed to browser
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } }
)

// Extend Express Request with clarifin user context
declare global {
  namespace Express {
    interface Request {
      clarifin?: { userId: string; plan: string }
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  try {
    let [dbUser] = await db.select().from(usersTable).where(eq(usersTable.authId, user.id))
    if (!dbUser) {
      ;[dbUser] = await db.insert(usersTable)
        .values({ authId: user.id, email: user.email ?? "", plan: "free" })
        .returning()
    }
    req.clarifin = { userId: dbUser.id, plan: dbUser.plan }
    next()
  } catch (err) {
    next(err)
  }
}
