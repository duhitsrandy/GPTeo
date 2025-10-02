"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SelectScan } from "@/db/schema/scans"
import { formatDistanceToNow } from "date-fns"
import { Eye, Loader2 } from "lucide-react"
import Link from "next/link"

type Scan = SelectScan & {
  summary: {
    totalPages: number
    totalFindings: number
    passCount: number
    failCount: number
  } | null
}

interface ScansTableProps {
  scans: Scan[]
  hasMore: boolean
}

export function ScansTable({ scans, hasMore }: ScansTableProps) {
  if (scans.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="border-border rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-border border-b">
              <tr>
                <th className="text-muted-foreground p-3 text-left text-xs font-medium uppercase tracking-wider">
                  Domain
                </th>
                <th className="text-muted-foreground p-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="text-muted-foreground p-3 text-left text-xs font-medium uppercase tracking-wider">
                  SEO Score
                </th>
                <th className="text-muted-foreground p-3 text-left text-xs font-medium uppercase tracking-wider">
                  GPTeo Score
                </th>
                <th className="text-muted-foreground p-3 text-left text-xs font-medium uppercase tracking-wider">
                  Mode
                </th>
                <th className="text-muted-foreground p-3 text-left text-xs font-medium uppercase tracking-wider">
                  Created
                </th>
                <th className="text-muted-foreground p-3 text-left text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {scans.map(scan => (
                <tr
                  key={scan.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="p-3">
                    <div className="font-medium">{scan.domain}</div>
                    {scan.summary && (
                      <div className="text-muted-foreground text-xs">
                        {scan.summary.totalPages} pages scanned
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={scan.status} />
                  </td>
                  <td className="p-3">
                    {scan.seoScore !== null ? (
                      <ScoreBadge score={scan.seoScore} />
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    {scan.gpteoScore !== null ? (
                      <ScoreBadge score={scan.gpteoScore} />
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize">
                      {scan.mode}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground p-3 text-sm">
                    {formatDistanceToNow(new Date(scan.createdAt), {
                      addSuffix: true
                    })}
                  </td>
                  <td className="p-3">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      disabled={scan.status !== "completed"}
                    >
                      <Link href={`/dashboard/scans/${scan.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline">Load More</Button>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    { variant: "default" | "secondary" | "destructive"; icon?: React.ReactNode }
  > = {
    queued: { variant: "secondary" },
    running: { variant: "default", icon: <Loader2 className="mr-1 h-3 w-3 animate-spin" /> },
    completed: { variant: "default" },
    failed: { variant: "destructive" },
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

function ScoreBadge({ score }: { score: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400"
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  return (
    <span className={`font-semibold ${getColor(score)}`}>{score}/100</span>
  )
}

