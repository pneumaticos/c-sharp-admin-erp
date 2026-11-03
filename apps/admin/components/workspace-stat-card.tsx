import { Card, CardContent } from "@workspace/ui/components/card"
import type { ReactNode } from "react"

type WorkspaceStatCardProps = {
  label: string
  value: ReactNode
  description: string
  tone?: "default" | "warning"
}

export function WorkspaceStatCard({ label, value, description, tone = "default" }: WorkspaceStatCardProps) {
  return (
    <Card className={`module-stat-card ${tone === "warning" ? "warning-stat" : ""}`}>
      <CardContent className="module-stat-card-content">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </CardContent>
    </Card>
  )
}
