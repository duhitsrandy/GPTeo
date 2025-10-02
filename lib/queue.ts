/**
 * Simple in-memory job queue for GPTeo scans
 * This is an MVP implementation. For production, upgrade to BullMQ with Redis.
 */

import { db } from "@/db"
import { scans } from "@/db/schema/scans"
import { eq } from "drizzle-orm"

type Job = {
  id: string
  scanId: string
  createdAt: Date
}

class ScanQueue {
  private queue: Job[] = []
  private processing = false
  private maxConcurrent = 1 // Process one scan at a time for MVP

  /**
   * Add a scan to the queue
   */
  async enqueue(scanId: string): Promise<void> {
    const job: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scanId,
      createdAt: new Date()
    }

    this.queue.push(job)
    console.log(`[Queue] Enqueued scan ${scanId}`)

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue()
    }
  }

  /**
   * Process jobs in the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true
    console.log(`[Queue] Starting to process ${this.queue.length} jobs`)

    while (this.queue.length > 0) {
      const job = this.queue.shift()
      if (!job) continue

      try {
        await this.processJob(job)
      } catch (error) {
        console.error(`[Queue] Error processing job ${job.id}:`, error)
      }

      // Small delay between jobs to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    this.processing = false
    console.log("[Queue] Finished processing queue")
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    console.log(`[Queue] Processing scan ${job.scanId}`)

    try {
      // Update scan status to 'running'
      await db
        .update(scans)
        .set({
          status: "running",
          startedAt: new Date()
        })
        .where(eq(scans.id, job.scanId))

      // TODO: Phase 3 - Implement actual scanning logic
      // This is where we'll:
      // 1. Fetch the scan configuration
      // 2. Crawl the seed URLs
      // 3. Extract data (JSON-LD, meta tags, etc.)
      // 4. Run checks against the data
      // 5. Compute scores
      // 6. Store results
      
      // For now, simulate a scan with a delay
      await this.simulateScan(job.scanId)

      console.log(`[Queue] Completed scan ${job.scanId}`)
    } catch (error) {
      console.error(`[Queue] Failed to process scan ${job.scanId}:`, error)

      // Update scan status to 'failed'
      await db
        .update(scans)
        .set({
          status: "failed",
          completedAt: new Date(),
          errorMessage:
            error instanceof Error ? error.message : "Unknown error occurred"
        })
        .where(eq(scans.id, job.scanId))
    }
  }

  /**
   * Simulate a scan (placeholder for MVP)
   * This will be replaced with actual scanning logic in Phase 3
   */
  private async simulateScan(scanId: string): Promise<void> {
    // Simulate scan taking 3-5 seconds
    const duration = 3000 + Math.random() * 2000
    await new Promise(resolve => setTimeout(resolve, duration))

    // For MVP, mark scan as completed with placeholder scores
    await db
      .update(scans)
      .set({
        status: "completed",
        completedAt: new Date(),
        seoScore: Math.floor(Math.random() * 30) + 60, // Random score 60-90
        gpteoScore: Math.floor(Math.random() * 30) + 50, // Random score 50-80
        scoreBreakdown: {
          seo: {
            meta: 85,
            canonical: 90,
            performance: 70
          },
          gpteo: {
            schema: 60,
            freshness: 50,
            identifiers: 75
          }
        }
      })
      .where(eq(scans.id, scanId))
  }

  /**
   * Get queue status
   */
  getStatus(): {
    queueLength: number
    processing: boolean
  } {
    return {
      queueLength: this.queue.length,
      processing: this.processing
    }
  }
}

// Export singleton instance
export const scanQueue = new ScanQueue()

