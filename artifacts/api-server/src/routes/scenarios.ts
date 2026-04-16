import { Router } from "express"
import type { Request, Response, NextFunction } from "express"
import { db } from "@workspace/db"
import { scenariosTable } from "@workspace/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { requireAuth } from "../middleware/auth"
import { z } from "zod"

const router = Router()

/** Limit JSONB blobs: max 50 keys, values must be finite numbers or short strings */
const scenarioDataValue = z.union([
  z.number().finite().min(-1_000_000_000).max(1_000_000_000),
  z.string().max(500),
  z.boolean(),
  z.null(),
])
const scenarioData = z.record(z.string().max(100), scenarioDataValue).refine(
  (obj) => Object.keys(obj).length <= 50,
  { message: "Too many keys in scenario data" }
)

const scenarioBodySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["job-change", "buy-home", "school", "child", "time-off", "custom"]),
  current: scenarioData,
  proposed: scenarioData,
})

// GET /api/scenarios
router.get("/scenarios", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarios = await db.select().from(scenariosTable)
      .where(eq(scenariosTable.userId, req.clarifin!.userId))
      .orderBy(desc(scenariosTable.createdAt))
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

// POST /api/scenarios/:id/share — generate (or return existing) share token
router.post("/scenarios/:id/share", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [scenario] = await db.select()
      .from(scenariosTable)
      .where(and(eq(scenariosTable.id, req.params.id), eq(scenariosTable.userId, req.clarifin!.userId)))
    if (!scenario) {
      res.status(404).json({ error: "Scenario not found" })
      return
    }
    // Reuse existing token if already shared
    const token = scenario.shareToken ?? crypto.randomUUID()
    if (!scenario.shareToken) {
      await db.update(scenariosTable)
        .set({ shareToken: token, updatedAt: new Date() })
        .where(eq(scenariosTable.id, req.params.id))
    }
    res.json({ token })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/scenarios/:id/share — revoke share token
router.delete("/scenarios/:id/share", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await db.update(scenariosTable)
      .set({ shareToken: null, updatedAt: new Date() })
      .where(and(eq(scenariosTable.id, req.params.id), eq(scenariosTable.userId, req.clarifin!.userId)))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// GET /api/shared/:token — public read-only scenario view (no auth required)
router.get("/shared/:token", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [scenario] = await db.select({
      id: scenariosTable.id,
      name: scenariosTable.name,
      type: scenariosTable.type,
      current: scenariosTable.current,
      proposed: scenariosTable.proposed,
      createdAt: scenariosTable.createdAt,
    })
      .from(scenariosTable)
      .where(eq(scenariosTable.shareToken, req.params.token))
    if (!scenario) {
      res.status(404).json({ error: "Shared scenario not found or link has been revoked" })
      return
    }
    res.json(scenario)
  } catch (err) {
    next(err)
  }
})

export default router
