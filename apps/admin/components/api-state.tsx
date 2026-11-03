import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react"

type ApiStateProps = {
  error?: string
  onRetry: () => void
  resource: string
}

export function ApiLoadingState({ resource }: Pick<ApiStateProps, "resource">) {
  return <div className="api-state"><span className="loading-mark" /><div><strong>Loading {resource}</strong><p>Retrieving the latest operational data.</p></div></div>
}

export function ApiErrorState({ error, onRetry, resource }: ApiStateProps) {
  return <div className="api-state api-error"><span className="state-icon"><WifiOff size={20} /></span><div><strong>{resource} are not available</strong><p>{error}</p><button onClick={onRetry} type="button"><RefreshCw size={14} /> Try again</button></div></div>
}

export function ApiEmptyState({ resource }: Pick<ApiStateProps, "resource">) {
  return <div className="api-state"><span className="state-icon"><AlertTriangle size={20} /></span><div><strong>No {resource.toLowerCase()} yet</strong><p>Create the first record to begin tracking this workspace.</p></div></div>
}
