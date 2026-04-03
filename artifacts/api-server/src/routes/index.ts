import { Router, type IRouter } from "express"
import express from "express"
import healthRouter from "./health"
import usersRouter from "./users"
import meRouter from "./me"
import profileRouter from "./profile"
import scenariosRouter from "./scenarios"
import advisorRouter from "./advisor"
import billingRouter from "./billing"

const router: IRouter = Router()

// Stripe webhook needs raw body for signature verification — mount before JSON body routes
router.use("/webhooks/stripe", express.raw({ type: "application/json" }), billingRouter)

router.use(healthRouter)
router.use(usersRouter)
router.use(meRouter)
router.use(profileRouter)
router.use(scenariosRouter)
router.use(advisorRouter)
router.use(billingRouter)

export default router
