import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  boolean,
  decimal
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { customers } from "./customers"

// Enums
export const scanStatus = pgEnum("scan_status", [
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled"
])

export const scanMode = pgEnum("scan_mode", [
  "quick", // 1-3 pages, basic checks
  "standard", // 5-10 pages, full checks
  "deep" // 20+ pages, comprehensive
])

export const pageType = pgEnum("page_type", [
  "homepage",
  "product",
  "category",
  "policy",
  "other"
])

export const findingStatus = pgEnum("finding_status", [
  "pass",
  "partial",
  "fail",
  "warning",
  "info"
])

// Main scans table
export const scans = pgTable("scans", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .references(() => customers.id, { onDelete: "cascade" })
    .notNull(),

  // Scan configuration
  domain: text("domain").notNull(), // normalized domain (no protocol)
  mode: scanMode("mode").default("quick").notNull(),
  seedUrls: jsonb("seed_urls").$type<string[]>().notNull(), // URLs to scan

  // Status & timing
  status: scanStatus("status").default("queued").notNull(),
  queuedAt: timestamp("queued_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),

  // Scores (computed after scan completes)
  seoScore: integer("seo_score"), // 0-100
  gpteoScore: integer("gpteo_score"), // 0-100
  
  // Score breakdown (for detailed view)
  scoreBreakdown: jsonb("score_breakdown").$type<{
    seo: Record<string, number> // category -> score
    gpteo: Record<string, number>
  }>(),

  // Metadata
  userAgent: text("user_agent"),
  checksVersion: text("checks_version").default("1.0.0").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

// Pages scanned
export const pages = pgTable("pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  scanId: uuid("scan_id")
    .references(() => scans.id, { onDelete: "cascade" })
    .notNull(),

  // Page identification
  url: text("url").notNull(),
  finalUrl: text("final_url"), // after redirects
  type: pageType("type").default("other").notNull(),

  // HTTP metadata
  statusCode: integer("status_code"),
  redirectChain: jsonb("redirect_chain").$type<string[]>(),
  headers: jsonb("headers").$type<Record<string, string>>(),
  
  // Content (optional storage based on plan)
  htmlSnapshot: text("html_snapshot"), // null for free tier
  
  // Extracted data
  jsonLd: jsonb("json_ld").$type<any[]>(), // all JSON-LD blocks
  metaTags: jsonb("meta_tags").$type<Record<string, string>>(),
  
  // Performance heuristics
  loadTimeMs: integer("load_time_ms"),
  sizeBytes: integer("size_bytes"),
  usedHeadlessBrowser: boolean("used_headless_browser").default(false),

  // Timestamps
  scannedAt: timestamp("scanned_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
})

// Individual check findings
export const findings = pgTable("findings", {
  id: uuid("id").defaultRandom().primaryKey(),
  pageId: uuid("page_id")
    .references(() => pages.id, { onDelete: "cascade" })
    .notNull(),
  checkId: uuid("check_id")
    .references(() => checks.id, { onDelete: "restrict" })
    .notNull(),

  // Result
  status: findingStatus("status").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }), // partial credit (0-100)
  
  // Evidence & explanation
  message: text("message").notNull(), // human-readable result
  evidence: jsonb("evidence").$type<{
    snippet?: string // HTML/JSON snippet showing the issue
    location?: string // CSS selector or JSON path
    found?: any // what was found
    expected?: any // what was expected
  }>(),

  // Fix suggestion
  fixSuggestion: text("fix_suggestion"),
  fixSnippet: text("fix_snippet"), // copy-paste code to fix

  createdAt: timestamp("created_at").defaultNow().notNull()
})

// Scan summary (aggregated stats)
export const scanSummaries = pgTable("scan_summaries", {
  id: uuid("id").defaultRandom().primaryKey(),
  scanId: uuid("scan_id")
    .references(() => scans.id, { onDelete: "cascade" })
    .notNull()
    .unique(),

  // Counts
  totalPages: integer("total_pages").notNull(),
  totalFindings: integer("total_findings").notNull(),
  passCount: integer("pass_count").notNull(),
  failCount: integer("fail_count").notNull(),
  warningCount: integer("warning_count").notNull(),

  // Category scores
  seoScoreBreakdown: jsonb("seo_score_breakdown").$type<Record<string, number>>(),
  gpteoScoreBreakdown: jsonb("gpteo_score_breakdown").$type<Record<string, number>>(),

  // Key issues (top 5 most critical)
  criticalIssues: jsonb("critical_issues").$type<Array<{
    checkKey: string
    message: string
    affectedPages: number
  }>>(),

  createdAt: timestamp("created_at").defaultNow().notNull()
})

// Relations
export const scansRelations = relations(scans, ({ one, many }) => ({
  customer: one(customers, {
    fields: [scans.customerId],
    references: [customers.id]
  }),
  pages: many(pages),
  summary: one(scanSummaries)
}))

export const pagesRelations = relations(pages, ({ one, many }) => ({
  scan: one(scans, {
    fields: [pages.scanId],
    references: [scans.id]
  }),
  findings: many(findings)
}))

export const findingsRelations = relations(findings, ({ one }) => ({
  page: one(pages, {
    fields: [findings.pageId],
    references: [pages.id]
  }),
  check: one(checks, {
    fields: [findings.checkId],
    references: [checks.id]
  })
}))

export const scanSummariesRelations = relations(scanSummaries, ({ one }) => ({
  scan: one(scans, {
    fields: [scanSummaries.scanId],
    references: [scans.id]
  })
}))

// Checks registry (imported from checks.ts)
import { checks } from "./checks"

// Type exports
export type InsertScan = typeof scans.$inferInsert
export type SelectScan = typeof scans.$inferSelect
export type InsertPage = typeof pages.$inferInsert
export type SelectPage = typeof pages.$inferSelect
export type InsertFinding = typeof findings.$inferInsert
export type SelectFinding = typeof findings.$inferSelect
export type InsertScanSummary = typeof scanSummaries.$inferInsert
export type SelectScanSummary = typeof scanSummaries.$inferSelect

