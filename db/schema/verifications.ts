import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  boolean,
  jsonb
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { customers } from "./customers"

// Enums
export const verificationType = pgEnum("verification_type", [
  "dns_txt",
  "file_upload",
  "meta_tag"
])

export const verificationStatus = pgEnum("verification_status", [
  "pending",
  "verified",
  "failed",
  "expired"
])

export const integrationProvider = pgEnum("integration_provider", [
  "shopify",
  "bigcommerce",
  "woocommerce",
  "magento",
  "custom_api"
])

export const integrationStatus = pgEnum("integration_status", [
  "connected",
  "disconnected",
  "error",
  "expired"
])

// Domain ownership verifications
export const verifications = pgTable("verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .references(() => customers.id, { onDelete: "cascade" })
    .notNull(),

  // Domain & verification details
  domain: text("domain").notNull(), // normalized domain
  type: verificationType("type").notNull(),
  status: verificationStatus("status").default("pending").notNull(),

  // Verification tokens/values
  token: text("token").notNull(), // generated token to check
  expectedValue: text("expected_value"), // for DNS TXT
  filePath: text("file_path"), // for file upload (e.g., /.well-known/gpteo-verify.txt)
  metaTag: text("meta_tag"), // for meta tag verification

  // Verification results
  verifiedAt: timestamp("verified_at"),
  lastCheckedAt: timestamp("last_checked_at"),
  nextCheckAt: timestamp("next_check_at"),
  errorMessage: text("error_message"),

  // Metadata
  expiresAt: timestamp("expires_at"), // optional expiration
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

// OAuth integrations for e-commerce platforms
export const integrations = pgTable("integrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .references(() => customers.id, { onDelete: "cascade" })
    .notNull(),

  // Integration details
  provider: integrationProvider("provider").notNull(),
  status: integrationStatus("status").default("connected").notNull(),
  
  // Store/shop identification
  shopDomain: text("shop_domain").notNull(),
  shopName: text("shop_name"),
  
  // OAuth credentials (encrypted in production)
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  
  // Scopes & permissions
  scopes: jsonb("scopes").$type<string[]>(),
  
  // Metadata
  lastSyncAt: timestamp("last_sync_at"),
  errorMessage: text("error_message"),
  
  // Settings
  autoScanOnUpdate: boolean("auto_scan_on_update").default(false),
  webhookUrl: text("webhook_url"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

// Scheduled scans
export const scheduledScans = pgTable("scheduled_scans", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .references(() => customers.id, { onDelete: "cascade" })
    .notNull(),

  // Target
  domain: text("domain").notNull(),
  verificationId: uuid("verification_id")
    .references(() => verifications.id, { onDelete: "set null" }),

  // Schedule configuration
  frequency: text("frequency").notNull(), // "daily", "weekly", "monthly"
  cronExpression: text("cron_expression"), // for custom schedules
  
  // Scan settings
  seedUrls: jsonb("seed_urls").$type<string[]>(),
  mode: text("mode").default("standard").notNull(),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at").notNull(),
  
  // Notifications
  emailOnComplete: boolean("email_on_complete").default(true),
  emailOnIssues: boolean("email_on_issues").default(true),
  webhookUrl: text("webhook_url"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

// Relations
export const verificationsRelations = relations(verifications, ({ one }) => ({
  customer: one(customers, {
    fields: [verifications.customerId],
    references: [customers.id]
  })
}))

export const integrationsRelations = relations(integrations, ({ one }) => ({
  customer: one(customers, {
    fields: [integrations.customerId],
    references: [customers.id]
  })
}))

export const scheduledScansRelations = relations(scheduledScans, ({ one }) => ({
  customer: one(customers, {
    fields: [scheduledScans.customerId],
    references: [customers.id]
  }),
  verification: one(verifications, {
    fields: [scheduledScans.verificationId],
    references: [verifications.id]
  })
}))

// Type exports
export type InsertVerification = typeof verifications.$inferInsert
export type SelectVerification = typeof verifications.$inferSelect
export type InsertIntegration = typeof integrations.$inferInsert
export type SelectIntegration = typeof integrations.$inferSelect
export type InsertScheduledScan = typeof scheduledScans.$inferInsert
export type SelectScheduledScan = typeof scheduledScans.$inferSelect

