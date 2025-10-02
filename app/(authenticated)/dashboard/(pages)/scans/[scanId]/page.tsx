import { getScanById } from "@/actions/scans"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { auth } from "@clerk/nextjs/server"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Loader2,
  TrendingUp,
  XCircle
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ScanDetailPage({
  params
}: {
  params: Promise<{ scanId: string }>
}) {
  const { userId } = await auth()
  const { scanId } = await params

  if (!userId) {
    return (
      <div className="bg-destructive/10 flex items-center gap-3 rounded-lg p-4">
        <AlertCircle className="text-destructive h-5 w-5" />
        <p className="text-foreground text-sm">
          Unable to load scan. Please try again.
        </p>
      </div>
    )
  }

  const response = await getScanById(scanId)

  if (!response.success || !response.scan) {
    notFound()
  }

  const scan = response.scan

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/dashboard/scans">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scans
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{scan.domain}</h1>
            <p className="text-muted-foreground mt-1">
              Scan ID: <code className="text-xs">{scan.id}</code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={scan.status} />
            <Badge variant="outline" className="capitalize">
              {scan.mode} scan
            </Badge>
          </div>
        </div>
      </div>

      {/* Scores */}
      {scan.status === "completed" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <ScoreCard
            title="SEO Score"
            score={scan.seoScore || 0}
            description="Traditional search engine optimization"
          />
          <ScoreCard
            title="GPTeo Score"
            score={scan.gpteoScore || 0}
            description="AI-readiness and discoverability"
          />
        </div>
      )}

      {/* Status Messages */}
      {scan.status === "queued" && (
        <div className="border-border bg-muted/50 flex items-center gap-3 rounded-lg border p-4">
          <Clock className="text-muted-foreground h-5 w-5" />
          <p className="text-sm">
            This scan is queued and will start processing soon.
          </p>
        </div>
      )}

      {scan.status === "running" && (
        <div className="bg-blue-50 flex items-center gap-3 rounded-lg border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Scan is currently running. This may take a few minutes.
          </p>
        </div>
      )}

      {scan.status === "failed" && (
        <div className="bg-destructive/10 flex items-center gap-3 rounded-lg border border-red-200 p-4 dark:border-red-800">
          <XCircle className="text-destructive h-5 w-5" />
          <div>
            <p className="text-destructive text-sm font-medium">
              Scan failed
            </p>
            {scan.errorMessage && (
              <p className="text-muted-foreground mt-1 text-xs">
                {scan.errorMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      {scan.summary && (
        <div className="border-border bg-card rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Summary</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            <SummaryStat
              label="Pages Scanned"
              value={scan.summary.totalPages}
            />
            <SummaryStat
              label="Total Findings"
              value={scan.summary.totalFindings}
            />
            <SummaryStat
              label="Passed"
              value={scan.summary.passCount}
              color="text-green-600 dark:text-green-400"
            />
            <SummaryStat
              label="Failed"
              value={scan.summary.failCount}
              color="text-red-600 dark:text-red-400"
            />
          </div>
        </div>
      )}

      {/* Scan Configuration */}
      <div className="border-border bg-card rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Configuration</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Mode:</dt>
            <dd className="font-medium capitalize">{scan.mode}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">URLs Scanned:</dt>
            <dd className="font-medium">{scan.seedUrls.length}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Created:</dt>
            <dd className="font-medium">
              {new Date(scan.createdAt).toLocaleString()}
            </dd>
          </div>
          {scan.completedAt && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Completed:</dt>
              <dd className="font-medium">
                {new Date(scan.completedAt).toLocaleString()}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* TODO: Phase 3 - Add detailed findings, pages scanned, and recommendations */}
    </div>
  )
}

function ScoreCard({
  title,
  score,
  description
}: {
  title: string
  score: number
  description: string
}) {
  const getColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400"
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getGrade = (score: number) => {
    if (score >= 90) return "A+"
    if (score >= 80) return "A"
    if (score >= 70) return "B"
    if (score >= 60) return "C"
    if (score >= 50) return "D"
    return "F"
  }

  return (
    <div className="border-border bg-card rounded-lg border p-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <TrendingUp className="text-muted-foreground h-5 w-5" />
      </div>
      <div className="mb-1 flex items-baseline gap-2">
        <span className={`text-4xl font-bold ${getColor(score)}`}>{score}</span>
        <span className="text-muted-foreground text-lg">/100</span>
        <Badge variant="outline" className="ml-2">
          {getGrade(score)}
        </Badge>
      </div>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}

function SummaryStat({
  label,
  value,
  color
}: {
  label: string
  value: number
  color?: string
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={`text-2xl font-bold ${color || ""}`}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    { variant: "default" | "secondary" | "destructive"; icon?: React.ReactNode }
  > = {
    queued: { variant: "secondary", icon: <Clock className="mr-1 h-3 w-3" /> },
    running: {
      variant: "default",
      icon: <Loader2 className="mr-1 h-3 w-3 animate-spin" />
    },
    completed: {
      variant: "default",
      icon: <CheckCircle className="mr-1 h-3 w-3" />
    },
    failed: { variant: "destructive", icon: <XCircle className="mr-1 h-3 w-3" /> },
    cancelled: { variant: "secondary" }
  }

  const config = variants[status] || variants.queued

  return (
    <Badge variant={config.variant} className="capitalize">
      {config.icon}
      {status}
    </Badge>
  )
}

