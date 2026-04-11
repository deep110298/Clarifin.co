import { Router } from "express"
import type { Request, Response, NextFunction } from "express"
import { db } from "@workspace/db"
import { scenariosTable } from "@workspace/db/schema"
import { eq, and } from "drizzle-orm"
import { requireAuth } from "../middleware/auth"
import { z } from "zod"

const router = Router()

const scenarioBodySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["job-change", "buy-home", "school", "child", "time-off", "custom"]),
  current: z.record(z.unknown()),
  proposed: z.record(z.unknown()),
})

// GET /api/scenarios
router.get("/scenarios", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarios = await db.select().from(scenariosTable)
      .where(eq(scenariosTable.userId, req.clarifin!.userId))
      .orderBy(scenariosTable.createdAt)
    res.json(scenarios)
  } catch (err) {
    next(err)
  }
})

// GET /api/scenarios/:id
router.get("/scenarios/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [scenario] = await db.select().from(scenariosTable)
      .where(and(eq(scenariosTable.id, req.params.id), eq(scenariosTable.userId, req.clarifin!.userId)))
    if (!scenario) {
      res.status(404).json({ error: "Scenario not found" })
      return
    }
    res.json(scenario)
  } catch (err) {
    next(err)
  }
})

// POST /api/scenarios
router.post("/scenarios", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  // Free plan: limit to 3 scenarios
  if (req.clarifin!.plan === "free") {
    const existing = await db.select().from(scenariosTable).where(eq(scenariosTable.userId, req.clarifin!.userId))
    if (existing.length >= 3) {
      res.status(402).json({ error: "Free plan limited to 3 scenarios. Upgrade to Plus for unlimited." })
      return
    }
  }

  const parsed = scenarioBodySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid scenario data", details: parsed.error.flatten() })
    return
  }

  try {
    const [scenario] = await db.insert(scenariosTable)
      .values({ ...parsed.data, userId: req.clarifin!.userId })
      .returning()
    res.status(201).json(scenario)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/scenarios/:id
router.patch("/scenarios/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const parsed = scenarioBodySchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() })
    return
  }
  try {
    const [scenario] = await db.update(scenariosTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(scenariosTable.id, req.params.id), eq(scenariosTable.userId, req.clarifin!.userId)))
      .returning()
    if (!scenario) {
      res.status(404).json({ error: "Not found" })
      return
    }
    res.json(scenario)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/scenarios/:id
router.delete("/scenarios/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await db.delete(scenariosTable)
      .where(and(eq(scenariosTable.id, req.params.id), eq(scenariosTable.userId, req.clarifin!.userId)))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
