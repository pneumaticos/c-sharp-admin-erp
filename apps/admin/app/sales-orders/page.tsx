"use client"

import { CheckCircle2, ClipboardCheck, Plus, Send, ShoppingCart, X } from "lucide-react"
import { FormEvent, useCallback, useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { ApiEmptyState, ApiErrorState, ApiLoadingState } from "@/components/api-state"
import { WorkspaceShell } from "@/components/workspace-shell"
import { WorkspaceStatCard } from "@/components/workspace-stat-card"
import { ApiResponse, apiConnectionMessage, erpApi, PagedResponse } from "@/lib/erp-api"

type Customer = { id: string; code: string; name: string }
type InventoryItem = { id: string; sku: string; name: string; unitCost: number }
type OrderLine = { inventoryItemId: string; description: string; quantity: number; unitPrice: number; lineTotal: number }
type SalesOrder = { id: string; number: string; customerId: string; customerName: string; status: string; subtotal: number; tax: number; total: number; currency: string; createdAt: string; lines: OrderLine[] }
type CreateOrderDraft = { customerId: string; inventoryItemId: string; quantity: string; unitPrice: string; externalReference: string }
const blankDraft: CreateOrderDraft = { customerId: "", inventoryItemId: "", quantity: "1", unitPrice: "", externalReference: "" }
const currency = new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 })

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[] | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [draft, setDraft] = useState<CreateOrderDraft>(blankDraft)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [orderResponse, customerResponse, inventoryResponse] = await Promise.all([
        erpApi<PagedResponse<SalesOrder>>("/api/v1/sales-orders?page=1&pageSize=50"),
        erpApi<PagedResponse<Customer>>("/api/v1/customers?page=1&pageSize=100"),
        erpApi<PagedResponse<InventoryItem>>("/api/v1/inventory/items?page=1&pageSize=100"),
      ])
      setOrders(orderResponse.data)
      setCustomers(customerResponse.data)
      setInventory(inventoryResponse.data)
    } catch (loadError) { setError(apiConnectionMessage(loadError)) }
  }, [])
  useEffect(() => { void load() }, [load])

  const openCreate = () => {
    const firstCustomer = customers[0]?.id ?? ""
    const firstItem = inventory[0]
    setDraft({ customerId: firstCustomer, inventoryItemId: firstItem?.id ?? "", quantity: "1", unitPrice: firstItem ? String(firstItem.unitCost) : "", externalReference: "" })
    setShowCreate(true)
  }

  const selectItem = (inventoryItemId: string) => {
    const item = inventory.find((candidate) => candidate.id === inventoryItemId)
    setDraft({ ...draft, inventoryItemId, unitPrice: item ? String(item.unitCost) : draft.unitPrice })
  }

  const createOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    try {
      const response = await erpApi<ApiResponse<SalesOrder>>("/api/v1/sales-orders", { method: "POST", body: JSON.stringify({ customerId: draft.customerId, currency: "KES", externalReference: draft.externalReference || null, lines: [{ inventoryItemId: draft.inventoryItemId, quantity: Number(draft.quantity), unitPrice: Number(draft.unitPrice) }] }) })
      setOrders((current) => [response.data, ...(current ?? [])])
      setShowCreate(false)
      setNotice(`${response.data.number} was created as a draft.`)
    } catch (submitError) { setNotice(apiConnectionMessage(submitError)) } finally { setSaving(false) }
  }

  const confirmOrder = async (order: SalesOrder) => {
    setSaving(true)
    try {
      const response = await erpApi<ApiResponse<SalesOrder>>(`/api/v1/sales-orders/${order.id}/confirm`, { method: "POST" })
      setOrders((current) => current?.map((candidate) => candidate.id === order.id ? response.data : candidate) ?? null)
      setNotice(`${response.data.number} confirmed.`)
    } catch (confirmError) { setNotice(apiConnectionMessage(confirmError)) } finally { setSaving(false) }
  }

  const draftCount = orders?.filter((order) => order.status === "Draft").length ?? 0
  const confirmedTotal = orders?.filter((order) => order.status === "Confirmed").reduce((total, order) => total + order.total, 0) ?? 0
  const canCreate = customers.length > 0 && inventory.length > 0

  return <WorkspaceShell action={<Button className="create-button" disabled={!canCreate} onClick={openCreate}><Plus size={17} /> New order</Button>}>
    <div className="workspace-area"><div className="module-hero"><div><p className="eyebrow">SALES WORKFLOW</p><h1>Sales orders</h1><p>Turn demand into structured, confirmable commercial commitments.</p></div><div className="connection-pill"><CheckCircle2 size={15} /> API-backed workspace</div></div>
      {orders ? <>
        <section className="module-stat-grid" aria-label="Sales order summary">
          <WorkspaceStatCard description="Ready for review and confirmation" label="OPEN DRAFTS" value={draftCount} />
          <WorkspaceStatCard description="Tax included" label="CONFIRMED VALUE" value={currency.format(confirmedTotal)} />
          <WorkspaceStatCard description="Items available for an order" label="AVAILABLE CATALOG" value={inventory.length} />
        </section>
        <Card className="module-panel">
          <CardHeader className="module-toolbar"><div><CardTitle>Order register</CardTitle><CardDescription>Draft orders can be confirmed exactly once through the ERP API.</CardDescription></div><CardAction><span className="register-caption"><ClipboardCheck size={15} /> Live state transitions</span></CardAction></CardHeader>
          <CardContent className="module-table-content">
            {orders.length ? <Table className="data-table">
              <TableHeader><TableRow><TableHead>ORDER</TableHead><TableHead>CUSTOMER</TableHead><TableHead>CREATED</TableHead><TableHead>TOTAL</TableHead><TableHead>STATUS</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
              <TableBody>{orders.map((order) => <TableRow key={order.id}><TableCell><strong>{order.number}</strong><span>{order.lines.length} line{order.lines.length === 1 ? "" : "s"}</span></TableCell><TableCell>{order.customerName}</TableCell><TableCell>{new Date(order.createdAt).toLocaleDateString("en-KE", { day: "2-digit", month: "short" })}</TableCell><TableCell><strong>{currency.format(order.total)}</strong></TableCell><TableCell><Badge className={`status ${order.status === "Confirmed" ? "sent" : "due-today"}`} variant="secondary">{order.status}</Badge></TableCell><TableCell>{order.status === "Draft" && <Button className="row-action" disabled={saving} onClick={() => void confirmOrder(order)} size="xs" type="button" variant="secondary">Confirm</Button>}</TableCell></TableRow>)}</TableBody>
            </Table> : <ApiEmptyState resource="sales orders" />}
          </CardContent>
        </Card>
      </> : error ? <ApiErrorState error={error} onRetry={() => void load()} resource="Sales orders" /> : <ApiLoadingState resource="sales orders" />}
    </div>
    {showCreate && <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && setShowCreate(false)}><form aria-labelledby="create-order-title" className="quick-create-modal form-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={createOrder}><div className="modal-heading"><div><p className="eyebrow">NEW SALES ORDER</p><h2 id="create-order-title">Create draft</h2></div><button aria-label="Close" className="icon-button" disabled={saving} onClick={() => setShowCreate(false)} type="button"><X size={18} /></button></div><div className="form-grid"><label>Customer<select className="form-input" onChange={(event) => setDraft({ ...draft, customerId: event.target.value })} required value={draft.customerId}>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.code} · {customer.name}</option>)}</select></label><label>Inventory item<select className="form-input" onChange={(event) => selectItem(event.target.value)} required value={draft.inventoryItemId}>{inventory.map((item) => <option key={item.id} value={item.id}>{item.sku} · {item.name}</option>)}</select></label><label>Quantity<input className="form-input" min="0.001" onChange={(event) => setDraft({ ...draft, quantity: event.target.value })} required step="0.001" type="number" value={draft.quantity} /></label><label>Unit price (KES)<input className="form-input" min="0" onChange={(event) => setDraft({ ...draft, unitPrice: event.target.value })} required step="0.01" type="number" value={draft.unitPrice} /></label><label className="form-full">External reference<input className="form-input" maxLength={80} onChange={(event) => setDraft({ ...draft, externalReference: event.target.value })} placeholder="Optional customer or web reference" value={draft.externalReference} /></label></div><Button className="form-submit" disabled={saving} type="submit"><ShoppingCart size={16} />{saving ? "Creating draft..." : "Create draft order"}</Button></form></div>}
    {notice && <div className="toast" role="status"><Send size={16} />{notice}</div>}
  </WorkspaceShell>
}
