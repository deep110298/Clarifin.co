import { Router } from "express"
import type { Request, Response, NextFunction } from "express"
import Anthropic from "@anthropic-ai/sdk"
import { db } from "@workspace/db"
import { profilesTable, scenariosTable, chatMessagesTable } from "@workspace/db/schema"
import { eq, count, asc } from "drizzle-orm"
import { requireAuth } from "../middleware/auth"
import { z } from "zod"
import rateLimit from "express-rate-limit"

const router = Router()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// 10 requests per minute per user (keyed on Clarifin user ID via IP fallback)
const advisorRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.clarifin?.userId ?? req.ip ?? "unknown",
  message: { error: "Too many requests. Please wait a moment and try again." },
})

const messageSchema = z.object({
  message: z.string().min(1).max(2000),
})

/** Strip characters that could break out of the system prompt context */
function sanitizeForPrompt(text: string, maxLen = 100): string {
  return text.replace(/[<>{}\\]/g, "").slice(0, maxLen)
}

router.post("/advisor", requireAuth, advisorRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  // Free plan: 5 questions lifetime, then gate
  if (req.clarifin!.plan === "free") {
    const [{ value: msgCount }] = await db
      .select({ value: count() })
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.userId, req.clarifin!.userId))
    if (msgCount >= 10) { // 5 user + 5 assistant = 10 rows
      res.status(402).json({ error: "Free plan includes 5 AI Advisor questions. Upgrade to Plus for unlimited." })
      return
    }
  }

  const parsed = messageSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() })
    return
  }

  const { message } = parsed.data

  try {
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.clarifin!.userId))
    const scenarios = await db.select({ name: scenariosTable.name }).from(scenariosTable).where(eq(scenariosTable.userId, req.clarifin!.userId))

    // Load chat history from DB — never trust client-provided history to prevent spoofing
    const dbHistory = await db.select({ role: chatMessagesTable.role, content: chatMessagesTable.content })
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.userId, req.clarifin!.userId))
      .orderBy(asc(chatMessagesTable.createdAt))
      .limit(20) // last 10 turns (20 rows = 10 user + 10 assistant)

    const expenses = profile?.expenses as Record<string, number> | undefined
    const savings = profile?.savings as Record<string, number> | undefined
    const debt = profile?.debt as Record<string, number> | undefined

    // Sanitize scenario names to prevent prompt injection
    const scenarioList = scenarios.length > 0
      ? scenarios.map((s: { name: string }) => sanitizeForPrompt(s.name)).join(", ")
      : null

    const systemPrompt = `You are Clarifin's AI Financial Advisor — a knowledgeable, direct, and empathetic financial coach. You help users model the impact of major life decisions on their finances.

IMPORTANT: You are NOT a licensed financial advisor. Always note when professional advice is warranted. Never recommend specific securities.

User's financial profile:
${profile ? `
- Annual gross income: $${profile.grossIncome.toLocaleString()}
- Filing status: ${profile.filingStatus}
- State: ${profile.state}
- Age: ${profile.age}
- Monthly expenses: housing $${expenses?.housing ?? 0}, transport $${expenses?.transport ?? 0}, food $${expenses?.food ?? 0}, utilities $${expenses?.utilities ?? 0}, healthcare $${expenses?.healthcare ?? 0}, other $${expenses?.other ?? 0}
- Savings: emergency fund $${savings?.emergency ?? 0}, retirement $${savings?.retirement ?? 0}, annual 401k contribution $${profile.annual401kContrib ?? 0}, annual Roth IRA contribution $${profile.annualRothIraContrib ?? 0}, other investments $${savings?.investments ?? 0}
- Debt: credit card $${debt?.creditCard ?? 0}, student loans $${debt?.studentLoans ?? 0}, car loans $${debt?.carLoans ?? 0}, other $${debt?.other ?? 0}
` : "Profile not yet set up — ask the user to complete their financial profile for personalized advice."}

${scenarioList ? `<user_scenarios>${scenarioList}</user_scenarios>` : "No saved scenarios yet."}

Be specific with dollar amounts. Use the user's actual numbers when doing calculations. Keep responses concise and actionable — 3-5 short paragraphs max. Use markdown for structure (bold key numbers, bullet points for lists).`

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...dbHistory.map((h: { role: string; content: string }) => ({ role: h.role as "user" | "assistant", content: h.content })),
        { role: "user", content: message },
      ],
    })

    const reply = response.content[0].type === "text" ? response.content[0].text : ""

    // Persist both turns to DB (used for free-tier counting + future history loading)
    await db.insert(chatMessagesTable).values([
      { userId: req.clarifin!.userId, role: "user", content: message },
      { userId: req.clarifin!.userId, role: "assistant", content: reply },
    ])

    res.json({ reply })
  } catch (err) {
    next(err)
  }
})

export default router
