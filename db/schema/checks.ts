import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  pgEnum,
  jsonb,
  timestamp
} from "drizzle-orm/pg-core"

// Enums
export const checkCategory = pgEnum("check_category", ["seo", "gpteo"])

export const checkSeverity = pgEnum("check_severity", [
  "critical",
  "high",
  "medium",
  "low",
  "info"
])

// Checks registry - defines all available checks
export const checks = pgTable("checks", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Check identification
  key: text("key").unique().notNull(), // e.g., "seo.meta.title"
  name: text("name").notNull(), // human-readable name
  description: text("description").notNull(),
  
  // Classification
  category: checkCategory("category").notNull(),
  severity: checkSeverity("severity").default("medium").notNull(),
  
  // Scoring
  weight: integer("weight").default(10).notNull(), // contribution to category score
  
  // Configuration
  config: jsonb("config").$type<{
    pageTypes?: string[] // which page types this check applies to
    requiredFields?: string[] // what data must be present
    thresholds?: Record<string, number>
    [key: string]: any
  }>(),

  // Versioning & lifecycle
  version: text("version").default("1.0.0").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  deprecatedAt: timestamp("deprecated_at"),
  deprecationMessage: text("deprecation_message"),

  // Documentation
  docsUrl: text("docs_url"),
  fixTemplate: text("fix_template"), // default fix suggestion template
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

// Type exports
export type InsertCheck = typeof checks.$inferInsert
export type SelectCheck = typeof checks.$inferSelect

