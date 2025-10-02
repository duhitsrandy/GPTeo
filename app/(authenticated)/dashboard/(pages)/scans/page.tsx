import { getUserScans, getUserScanStats } from "@/actions/scans"
import { auth } from "@clerk/nextjs/server"
import { AlertCircle, ScanLine, TrendingUp } from "lucide-react"
import { NewScanForm } from "./_components/new-scan-form"
import { ScansTable } from "./_components/scans-table"
import { StatsCards } from "./_components/stats-cards"

export default async function ScansPage() {
  const { userId } = await auth()

  if (!userId) {
    return (
      <div>
        <div className="bg-destructive/10 flex items-center gap-3 rounded-lg p-4">
          <AlertCircle className="text-destructive h-5 w-5" />
          <p className="text-foreground text-sm">
            Unable to load scans. Please try again.
          </p>
        </div>
      </div>
    )
  }

  const [scansResponse, statsResponse] = await Promise.all([
    getUserScans({ limit: 10 }),
    getUserScanStats()
  ])

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <ScanLine className="text-muted-foreground h-8 w-8" />
          Scans
        </h1>
        <p className="text-muted-foreground">
          Scan websites for SEO and AI-readiness (GPTeo)
        </p>
      </div>

      {/* Stats Cards */}
      {statsResponse.success && statsResponse.stats && (
        <StatsCards stats={statsResponse.stats} />
      )}

      {/* New Scan Form */}
      <div className="border-border bg-card rounded-lg border p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">New Scan</h2>
          <p className="text-muted-foreground text-sm">
            Enter a domain and URLs to scan for SEO and GPTeo optimization
          </p>
        </div>
        <NewScanForm />
      </div>

      {/* Recent Scans */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Recent Scans</h2>
          <p className="text-muted-foreground text-sm">
            View your scan history and results
          </p>
        </div>

        {scansResponse.success && scansResponse.scans ? (
          <ScansTable
            scans={scansResponse.scans}
            hasMore={scansResponse.hasMore || false}
          />
        ) : (
          <div className="border-border bg-muted/30 rounded-lg border p-8 text-center">
            <TrendingUp className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
            <p className="text-muted-foreground">
              No scans yet. Create your first scan above!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

