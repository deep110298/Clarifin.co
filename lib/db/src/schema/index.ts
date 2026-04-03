import { pgTable, text, uuid, integer, jsonb, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"

export const planEnum = pgEnum("plan", ["free", "plus", "advisor"])

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  plan: planEnum("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const profilesTable = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  grossIncome: integer("gross_income").notNull().default(0),
  filingStatus: text("filing_status").notNull().default("single"),
  state: text("state").notNull().default("TX"),
  age: integer("age").notNull().default(30),
  // Monthly expenses stored as JSONB
  expenses: jsonb("expenses").$type<{
    housing: number; transport: number; food: number;
    utilities: number; healthcare: number; other: number;
  }>().notNull().default({ housing: 0, transport: 0, food: 0, utilities: 0, healthcare: 0, other: 0 }),
  // Savings stored as JSONB
  savings: jsonb("savings").$type<{
    emergency: number; retirement: number; monthlyContrib: number; investments: number;
  }>().notNull().default({ emergency: 0, retirement: 0, monthlyContrib: 0, investments: 0 }),
  // Debt stored as JSONB
  debt: jsonb("debt").$type<{
    creditCard: number; studentLoans: number; carLoans: number; other: number;
  }>().notNull().default({ creditCard: 0, studentLoans: 0, carLoans: 0, other: 0 }),
  isComplete: boolean("is_complete").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const scenariosTable = pgTable("scenarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // "job-change" | "buy-home" | "school" | "child" | "time-off" | "custom"
  current: jsonb("current").$type<Record<string, unknown>>().notNull().default({}),
  proposed: jsonb("proposed").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const chatMessagesTable = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Zod insert schemas
export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true })
export const insertProfileSchema = createInsertSchema(profilesTable).omit({ id: true, createdAt: true, updatedAt: true })
export const insertScenarioSchema = createInsertSchema(scenariosTable).omit({ id: true, createdAt: true, updatedAt: true })

export type User = typeof usersTable.$inferSelect
export type Profile = typeof profilesTable.$inferSelect
export type Scenario = typeof scenariosTable.$inferSelect
export type ChatMessage = typeof chatMessagesTable.$inferSelect
