import { Router } from "express"
import type { Request, Response, NextFunction } from "express"
import { createClient } from "@supabase/supabase-js"
import { db } from "@workspace/db"
import { usersTable } from "@workspace/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "../middleware/auth"

const router = Router()

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } }
)

// DELETE /api/me — delete account from Supabase Auth + all DB data
router.delete("/me", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Find the user's auth_id
    const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.clarifin!.userId))
    if (dbUser) {
      await supabaseAdmin.auth.admin.deleteUser(dbUser.authId)
    }
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
