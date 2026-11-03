"use client"

import { CheckCircle2, Plus, Search, Users, X } from "lucide-react"
import { FormEvent, useCallback, useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { ApiEmptyState, ApiErrorState, ApiLoadingState } from "@/components/api-state"
import { WorkspaceShell } from "@/components/workspace-shell"
import { WorkspaceStatCard } from "@/components/workspace-stat-card"
import { ApiResponse, apiConnectionMessage, erpApi, PagedResponse } from "@/lib/erp-api"

type Customer = { id: string; code: string; name: string; email: string; phone?: string; status: string; outstandingBalance: number; createdAt: string }
type CustomerDraft = { name: string; email: string; phone: string; taxNumber: string }
const blankCustomer: CustomerDraft = { name: "", email: "", phone: "", taxNumber: "" }
const currency = new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 })

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [draft, setDraft] = useState<CustomerDraft>(blankCustomer)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const response = await erpApi<PagedResponse<Customer>>("/api/v1/customers?page=1&pageSize=50")
      setCustomers(response.data)
    } catch (loadError) { setError(apiConnectionMessage(loadError)) }
  }, [])
  useEffect(() => { void load() }, [load])

  const submitCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    try {
      const response = await erpApi<ApiResponse<Customer>>("/api/v1/customers", { method: "POST", body: JSON.stringify(draft) })
      setCustomers((current) => [...(current ?? []), response.data].sort((a, b) => a.code.localeCompare(b.code)))
      setShowCreate(false)
      setDraft(blankCustomer)
      setNotice(`${response.data.name} was added to customers.`)
    } catch (submitError) { setNotice(apiConnectionMessage(submitError)) } finally { setSaving(false) }
  }

  const receivables = customers?.reduce((total, customer) => total + customer.outstandingBalance, 0) ?? 0
  return <WorkspaceShell action={<Button className="create-button" onClick={() => setShowCreate(true)}><Plus size={17} /> New customer</Button>}>
    <div className="workspace-area"><div className="module-hero"><div><p className="eyebrow">CUSTOMER LEDGER</p><h1>Customers</h1><p>Manage the people and businesses that keep revenue moving.</p></div><div className="connection-pill"><CheckCircle2 size={15} /> API-backed workspace</div></div>
      {customers ? <>
        <section className="module-stat-grid" aria-label="Customer summary">
          <WorkspaceStatCard description="All accounts are active" label="ACTIVE CUSTOMERS" value={customers.length} />
          <WorkspaceStatCard description="Across open invoices" label="OUTSTANDING BALANCE" value={currency.format(receivables)} />
          <WorkspaceStatCard description="Per customer account" label="AVERAGE BALANCE" value={currency.format(customers.length ? receivables / customers.length : 0)} />
        </section>
        <Card className="module-panel">
          <CardHeader className="module-toolbar"><div><CardTitle>Customer directory</CardTitle><CardDescription>Accounts are created with validated email addresses.</CardDescription></div><CardAction><div className="read-only-search"><Search size={15} /> Search is ready for the next API filter</div></CardAction></CardHeader>
          <CardContent className="module-table-content">
            {customers.length ? <Table className="data-table">
              <TableHeader><TableRow><TableHead>CUSTOMER</TableHead><TableHead>CONTACT</TableHead><TableHead>STATUS</TableHead><TableHead>OUTSTANDING</TableHead><TableHead>CREATED</TableHead></TableRow></TableHeader>
              <TableBody>{customers.map((customer) => <TableRow key={customer.id}><TableCell><strong>{customer.name}</strong><span>{customer.code}</span></TableCell><TableCell><strong>{customer.email}</strong><span>{customer.phone ?? "No phone recorded"}</span></TableCell><TableCell><Badge className="status sent" variant="secondary">{customer.status}</Badge></TableCell><TableCell><strong>{currency.format(customer.outstandingBalance)}</strong></TableCell><TableCell>{new Date(customer.createdAt).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}</TableCell></TableRow>)}</TableBody>
            </Table> : <ApiEmptyState resource="customers" />}
          </CardContent>
        </Card>
      </> : error ? <ApiErrorState error={error} onRetry={() => void load()} resource="Customers" /> : <ApiLoadingState resource="customers" />}
    </div>
    {showCreate && <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && setShowCreate(false)}><form aria-labelledby="create-customer-title" className="quick-create-modal form-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={submitCustomer}><div className="modal-heading"><div><p className="eyebrow">NEW CUSTOMER</p><h2 id="create-customer-title">Add customer</h2></div><button aria-label="Close" className="icon-button" disabled={saving} onClick={() => setShowCreate(false)} type="button"><X size={18} /></button></div><div className="form-grid"><label>Name<input autoFocus className="form-input" maxLength={120} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required value={draft.name} /></label><label>Email<input className="form-input" onChange={(event) => setDraft({ ...draft, email: event.target.value })} required type="email" value={draft.email} /></label><label>Phone<input className="form-input" onChange={(event) => setDraft({ ...draft, phone: event.target.value })} value={draft.phone} /></label><label>Tax number<input className="form-input" onChange={(event) => setDraft({ ...draft, taxNumber: event.target.value })} value={draft.taxNumber} /></label></div><Button className="form-submit" disabled={saving} type="submit"><Users size={16} />{saving ? "Creating customer..." : "Create customer"}</Button></form></div>}
    {notice && <div className="toast" role="status">{notice}</div>}
  </WorkspaceShell>
}
