import { Router } from "express"
import type { Request, Response } from "express"
import { Webhook } from "svix"
import { db } from "@workspace/db"
import { usersTable } from "@workspace/db/schema"
import { eq } from "drizzle-orm"
import { logger } from "../lib/logger"

const router = Router()

router.post("/webhooks/clerk", async (req: Request, res: Response) => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) {
    res.status(500).json({ error: "Webhook secret not configured" })
    return
  }

  const svix_id = req.headers["svix-id"] as string
  const svix_timestamp = req.headers["svix-timestamp"] as string
  const svix_signature = req.headers["svix-signature"] as string

  if (!svix_id || !svix_timestamp || !svix_signature) {
    res.status(400).json({ error: "Missing svix headers" })
    return
  }

  let payload: { type: string; data: Record<string, unknown> }
  try {
    const wh = new Webhook(webhookSecret)
    payload = wh.verify(JSON.stringify(req.body), {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as typeof payload
  } catch (err) {
    logger.error({ err }, "Invalid Clerk webhook signature")
    res.status(400).json({ error: "Invalid signature" })
    return
  }

  const { type, data } = payload

  try {
    if (type === "user.created" || type === "user.updated") {
      const clerkId = data.id as string
      const email = (data.email_addresses as Array<{ email_address: string }>)?.[0]?.email_address ?? ""
      await db.insert(usersTable)
        .values({ clerkId, email, plan: "free" })
        .onConflictDoUpdate({ target: usersTable.clerkId, set: { email, updatedAt: new Date() } })
    }
    if (type === "user.deleted") {
      await db.delete(usersTable).where(eq(usersTable.clerkId, data.id as string))
    }
    res.json({ received: true })
  } catch (err) {
    logger.error({ err }, "Error processing Clerk webhook")
    res.status(500).json({ error: "Internal error" })
  }
})

export default router
