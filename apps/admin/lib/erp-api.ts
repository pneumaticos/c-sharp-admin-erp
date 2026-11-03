export type ApiMeta = {
  requestId: string
  generatedAt: string
}

export type ApiResponse<T> = {
  data: T
  meta?: ApiMeta
}

export type PagedResponse<T> = {
  data: T[]
  meta: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

export type ApiProblem = {
  title?: string
  detail?: string
  code?: string
  status?: number
}

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5049").replace(/\/$/, "")

export class ErpApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = "ErpApiError"
  }
}

export async function erpApi<T>(path: string, init?: RequestInit): Promise<T> {
  const requestId = crypto.randomUUID()
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Request-Id": requestId,
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as ApiProblem
    throw new ErpApiError(problem.title ?? "The ERP API request could not be completed.", response.status)
  }

  return response.json() as Promise<T>
}

export function apiConnectionMessage(error: unknown): string {
  if (error instanceof ErpApiError) return error.message
  return `The ERP API at ${apiBaseUrl} is unavailable. Start the .NET service or set NEXT_PUBLIC_API_BASE_URL.`
}
