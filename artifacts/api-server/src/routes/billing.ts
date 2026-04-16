import { Router } from "express"
import type { Request, Response, NextFunction } from "express"
import Stripe from "stripe"
import { db } from "@workspace/db"
import { usersTable } from "@workspace/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "../middleware/auth"
import { logger } from "../lib/logger"
import { z } from "zod"

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2025-04-30.basil" })

const checkoutSchema = z.object({
  plan: z.enum(["plus", "advisor"]),
})

const PLAN_PRICES: Record<string, string> = {
  plus: process.env.STRIPE_PLUS_PRICE_ID ?? "",
  advisor: process.env.STRIPE_ADVISOR_PRICE_ID ?? "",
}

router.post("/billing/checkout", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const parsed = checkoutSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid plan" })
    return
  }
  const { plan } = parsed.data
  const priceId = PLAN_PRICES[plan]
  if (!priceId) {
    res.status(400).json({ error: "Plan price not configured" })
    return
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.clarifin!.userId))
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: user?.stripeCustomerId ?? undefined,
      customer_email: user?.stripeCustomerId ? undefined : user?.email,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId: req.clarifin!.userId, plan },
      },
      success_url: `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/app/dashboard?upgraded=1`,
      cancel_url: `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/app/scenarios`,
      metadata: { userId: req.clarifin!.userId, plan },
      custom_text: {
        submit: { message: "You'll get a 7-day free trial. Cancel anytime." },
      },
    })
    res.json({ url: session.url })
  } catch (err) {
    next(err)
  }
})

router.post("/billing/portal", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.clarifin!.userId))
    if (!user?.stripeCustomerId) {
      res.status(400).json({ error: "No billing account found" })
      return
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/app/dashboard`,
    })
    res.json({ url: session.url })
  } catch (err) {
    next(err)
  }
})

// Stripe webhook — needs raw body (mounted separately in routes/index.ts)
router.post("/webhooks/stripe", async (req: Request, res: Response) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET is not set — rejecting webhook")
    res.status(500).json({ error: "Webhook secret not configured" })
    return
  }
  const sig = req.headers["stripe-signature"] as string
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err) {
    logger.error({ err }, "Invalid Stripe webhook signature")
    res.status(400).send("Invalid signature")
    return
  }
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.CheckoutSession
      const userId = session.metadata?.userId
      const customerId = typeof session.customer === "string" ? session.customer : null
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : null

      // Validate the plan by looking up the actual price from Stripe — never trust metadata alone
      let plan: "plus" | "advisor" | null = null
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price"] })
        const priceId = subscription.items.data[0]?.price?.id
        if (priceId === PLAN_PRICES.plus) plan = "plus"
        else if (priceId === PLAN_PRICES.advisor) plan = "advisor"
      }

      if (userId && plan && customerId) {
        await db.update(usersTable)
          .set({ plan, stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId, updatedAt: new Date() })
          .where(eq(usersTable.id, userId))
      } else {
        logger.warn({ userId, plan, customerId, subscriptionId }, "Stripe checkout.session.completed: could not resolve plan — skipping DB update")
      }
    }
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription
      await db.update(usersTable)
        .set({ plan: "free", stripeSubscriptionId: null, updatedAt: new Date() })
        .where(eq(usersTable.stripeSubscriptionId, sub.id))
    }
    res.json({ received: true })
  } catch (err) {
    logger.error({ err }, "Error processing Stripe webhook")
    res.status(500).json({ error: "Internal error" })
  }
})

export default router
