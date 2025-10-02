import { config } from "dotenv"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import postgres from "postgres"

// Schema imports
import { customers } from "./schema/customers"
import {
  scans,
  pages,
  findings,
  scanSummaries,
  scansRelations,
  pagesRelations,
  findingsRelations,
  scanSummariesRelations
} from "./schema/scans"
import { checks } from "./schema/checks"
import {
  verifications,
  integrations,
  scheduledScans,
  verificationsRelations,
  integrationsRelations,
  scheduledScansRelations
} from "./schema/verifications"

config({ path: ".env.local" })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set")
}

const dbSchema = {
  // tables
  customers,
  scans,
  pages,
  findings,
  scanSummaries,
  checks,
  verifications,
  integrations,
  scheduledScans,
  // relations
  scansRelations,
  pagesRelations,
  findingsRelations,
  scanSummariesRelations,
  verificationsRelations,
  integrationsRelations,
  scheduledScansRelations
}

function initializeDb(url: string) {
  const client = postgres(url, { prepare: false })
  return drizzlePostgres(client, { schema: dbSchema })
}

export const db = initializeDb(databaseUrl)

// Re-export schemas for convenience
export * from "./schema/customers"
export * from "./schema/scans"
export * from "./schema/checks"
export * from "./schema/verifications"
