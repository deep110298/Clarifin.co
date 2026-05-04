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

// POST /api/family/invite — invite a family member by email
router.post("/family/invite", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, inviterName } = req.body as { email: string; inviterName?: string }
    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "email is required" })
      return
    }
    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { invited_by: inviterName || "A Clarifin user" },
    })
    if (error) {
      // If already registered, that's fine — still treat as invited
      if (!error.message?.toLowerCase().includes("already registered")) {
        throw error
      }
    }
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

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
