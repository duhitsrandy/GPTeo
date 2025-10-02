"use server"

import { db } from "@/db"
import { scans, pages, findings, scanSummaries } from "@/db/schema/scans"
import { auth } from "@clerk/nextjs/server"
import { eq, desc, and } from "drizzle-orm"
import { scanQueue } from "@/lib/queue"

/**
 * Create a new scan
 */
export async function createScan(data: {
  domain: string
  seedUrls: string[]
  mode?: "quick" | "standard" | "deep"
}) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

    // Get customer record
    const customer = await db.query.customers.findFirst({
      where: (customers, { eq }) => eq(customers.userId, userId)
    })

    if (!customer) {
      return { success: false, error: "Customer not found" }
    }

    // Validate domain
    const normalizedDomain = normalizeDomain(data.domain)
    if (!normalizedDomain) {
      return { success: false, error: "Invalid domain" }
    }

    // Validate seed URLs
    if (!data.seedUrls || data.seedUrls.length === 0) {
      return {
        success: false,
        error: "At least one URL is required"
      }
    }

    // Create scan record
    const [scan] = await db
      .insert(scans)
      .values({
        customerId: customer.id,
        domain: normalizedDomain,
        seedUrls: data.seedUrls,
        mode: data.mode || "quick",
        status: "queued",
        userAgent: "GPTeo-Scanner/1.0"
      })
      .returning()

    // Enqueue the scan for processing
    await scanQueue.enqueue(scan.id)

    return {
      success: true,
      scan: {
        id: scan.id,
        domain: scan.domain,
        status: scan.status,
        mode: scan.mode,
        createdAt: scan.createdAt
      }
    }
  } catch (error) {
    console.error("Error creating scan:", error)
    return {
      success: false,
      error: "Failed to create scan"
    }
  }
}

/**
 * Get a single scan by ID
 */
export async function getScanById(scanId: string) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

    const customer = await db.query.customers.findFirst({
      where: (customers, { eq }) => eq(customers.userId, userId)
    })

    if (!customer) {
      return { success: false, error: "Customer not found" }
    }

    const scan = await db.query.scans.findFirst({
      where: and(eq(scans.id, scanId), eq(scans.customerId, customer.id)),
      with: {
        pages: {
          with: {
            findings: {
              with: {
                check: true
              }
            }
          }
        },
        summary: true
      }
    })

    if (!scan) {
      return { success: false, error: "Scan not found" }
    }

    return { success: true, scan }
  } catch (error) {
    console.error("Error fetching scan:", error)
    return { success: false, error: "Failed to fetch scan" }
  }
}

/**
 * Get all scans for the current user
 */
export async function getUserScans(options?: {
  limit?: number
  offset?: number
}) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

    const customer = await db.query.customers.findFirst({
      where: (customers, { eq }) => eq(customers.userId, userId)
    })

    if (!customer) {
      return { success: false, error: "Customer not found" }
    }

    const limit = options?.limit || 10
    const offset = options?.offset || 0

    const userScans = await db.query.scans.findMany({
      where: eq(scans.customerId, customer.id),
      orderBy: [desc(scans.createdAt)],
      limit,
      offset,
      with: {
        summary: true
      }
    })

    // Get total count
    const totalCount = await db.query.scans.findMany({
      where: eq(scans.customerId, customer.id)
    })

    return {
      success: true,
      scans: userScans,
      total: totalCount.length,
      hasMore: totalCount.length > offset + limit
    }
  } catch (error) {
    console.error("Error fetching scans:", error)
    return { success: false, error: "Failed to fetch scans" }
  }
}

/**
 * Get scan statistics for the current user
 */
export async function getUserScanStats() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

    const customer = await db.query.customers.findFirst({
      where: (customers, { eq }) => eq(customers.userId, userId)
    })

    if (!customer) {
      return { success: false, error: "Customer not found" }
    }

    const userScans = await db.query.scans.findMany({
      where: eq(scans.customerId, customer.id)
    })

    const stats = {
      total: userScans.length,
      completed: userScans.filter(s => s.status === "completed").length,
      running: userScans.filter(s => s.status === "running").length,
      queued: userScans.filter(s => s.status === "queued").length,
      failed: userScans.filter(s => s.status === "failed").length,
      avgSeoScore:
        userScans
          .filter(s => s.seoScore !== null)
          .reduce((sum, s) => sum + (s.seoScore || 0), 0) /
          userScans.filter(s => s.seoScore !== null).length || 0,
      avgGpteoScore:
        userScans
          .filter(s => s.gpteoScore !== null)
          .reduce((sum, s) => sum + (s.gpteoScore || 0), 0) /
          userScans.filter(s => s.gpteoScore !== null).length || 0
    }

    return { success: true, stats }
  } catch (error) {
    console.error("Error fetching scan stats:", error)
    return { success: false, error: "Failed to fetch scan stats" }
  }
}

/**
 * Cancel a running scan
 */
export async function cancelScan(scanId: string) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

    const customer = await db.query.customers.findFirst({
      where: (customers, { eq }) => eq(customers.userId, userId)
    })

    if (!customer) {
      return { success: false, error: "Customer not found" }
    }

    // Check if scan belongs to user
    const scan = await db.query.scans.findFirst({
      where: and(eq(scans.id, scanId), eq(scans.customerId, customer.id))
    })

    if (!scan) {
      return { success: false, error: "Scan not found" }
    }

    if (scan.status === "completed" || scan.status === "failed") {
      return { success: false, error: "Cannot cancel completed or failed scan" }
    }

    // Update scan status
    await db
      .update(scans)
      .set({ status: "cancelled", completedAt: new Date() })
      .where(eq(scans.id, scanId))

    return { success: true }
  } catch (error) {
    console.error("Error cancelling scan:", error)
    return { success: false, error: "Failed to cancel scan" }
  }
}

/**
 * Helper: Normalize domain (remove protocol, www, trailing slash)
 */
function normalizeDomain(input: string): string | null {
  try {
    let domain = input.trim().toLowerCase()

    // Remove protocol
    domain = domain.replace(/^https?:\/\//, "")

    // Remove www
    domain = domain.replace(/^www\./, "")

    // Remove trailing slash and path
    domain = domain.split("/")[0]

    // Remove port if present
    domain = domain.split(":")[0]

    // Basic validation
    if (!domain || !domain.includes(".")) {
      return null
    }

    return domain
  } catch {
    return null
  }
}

