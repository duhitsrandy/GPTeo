import {
  CheckCircle,
  Clock,
  Loader2,
  TrendingUp,
  XCircle
} from "lucide-react"

interface Stats {
  total: number
  completed: number
  running: number
  queued: number
  failed: number
  avgSeoScore: number
  avgGpteoScore: number
}

interface StatsCardsProps {
  stats: Stats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Total Scans",
      value: stats.total,
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400"
    },
    {
      label: "Running",
      value: stats.running,
      icon: Loader2,
      color: "text-yellow-600 dark:text-yellow-400",
      animated: true
    },
    {
      label: "Queued",
      value: stats.queued,
      icon: Clock,
      color: "text-gray-600 dark:text-gray-400"
    },
    {
      label: "Avg SEO Score",
      value: isNaN(stats.avgSeoScore) ? "-" : Math.round(stats.avgSeoScore),
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      suffix: !isNaN(stats.avgSeoScore) ? "/100" : ""
    },
    {
      label: "Avg GPTeo Score",
      value: isNaN(stats.avgGpteoScore)
        ? "-"
        : Math.round(stats.avgGpteoScore),
      icon: TrendingUp,
      color: "text-indigo-600 dark:text-indigo-400",
      suffix: !isNaN(stats.avgGpteoScore) ? "/100" : ""
    }
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map(card => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="border-border bg-card rounded-lg border p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {card.value}
                  {card.suffix && (
                    <span className="text-muted-foreground text-sm font-normal">
                      {card.suffix}
                    </span>
                  )}
                </p>
              </div>
              <Icon
                className={`h-5 w-5 ${card.color} ${card.animated ? "animate-spin" : ""}`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

