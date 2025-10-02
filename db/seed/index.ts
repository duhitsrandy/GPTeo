"use server"

import process from "process"
import { db } from "../index"
import { customers } from "../schema/customers"
import { checks } from "../schema/checks"
import { customersData } from "./data/customers"
import { initialChecks } from "./data/checks"

async function seed() {
  console.warn("Seeding database...")

  // Reset all tables in reverse order of dependencies
  console.warn("Resetting tables...")
  await db.execute("TRUNCATE TABLE customers CASCADE")
  await db.execute("TRUNCATE TABLE checks CASCADE")
  console.warn("Finished resetting tables")

  // Seed checks (required for scans to work)
  console.warn("Seeding checks registry...")
  await db.insert(checks).values(initialChecks)
  console.warn(`Seeded ${initialChecks.length} checks`)

  // Seed customers
  console.warn("Seeding customers...")
  await db.insert(customers).values(customersData)

  console.warn("Seeding complete!")
  db.$client.end()
}

seed().catch(error => {
  console.error("Error seeding database:", error)
  process.exit(1)
})
