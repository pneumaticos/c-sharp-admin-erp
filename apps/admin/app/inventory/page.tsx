"use client"

import { ArrowDown, ArrowUp, Boxes, CheckCircle2, Plus, SlidersHorizontal, X } from "lucide-react"
import { FormEvent, useCallback, useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { ApiEmptyState, ApiErrorState, ApiLoadingState } from "@/components/api-state"
import { WorkspaceShell } from "@/components/workspace-shell"
import { WorkspaceStatCard } from "@/components/workspace-stat-card"
import { ApiResponse, apiConnectionMessage, erpApi, PagedResponse } from "@/lib/erp-api"

type InventoryItem = { id: string; sku: string; name: string; quantityOnHand: number; reorderLevel: number; unitCost: number; currency: string; warehouse: string }

const currency = new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 })

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [quantityDelta, setQuantityDelta] = useState("1")
  const [reason, setReason] = useState("Cycle count correction")
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const response = await erpApi<PagedResponse<InventoryItem>>("/api/v1/inventory/items?page=1&pageSize=50")
      setItems(response.data)
    } catch (loadError) {
      setError(apiConnectionMessage(loadError))
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const openAdjustment = (item: InventoryItem) => {
    setSelectedItem(item)
    setQuantityDelta("1")
    setReason("Cycle count correction")
  }

  const submitAdjustment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedItem) return
    setSaving(true)
    try {
      const response = await erpApi<ApiResponse<InventoryItem>>(`/api/v1/inventory/items/${selectedItem.id}/adjustments`, {
        method: "POST",
        body: JSON.stringify({ quantityDelta: Number(quantityDelta), reason, reference: `WEB-ADJ-${Date.now()}` }),
      })
      setItems((current) => current?.map((item) => item.id === response.data.id ? response.data : item) ?? null)
      setSelectedItem(null)
      setNotice(`${response.data.sku} stock updated successfully.`)
    } catch (submitError) {
      setNotice(apiConnectionMessage(submitError))
    } finally {
      setSaving(false)
    }
  }

  const lowStockCount = items?.filter((item) => item.quantityOnHand <= item.reorderLevel).length ?? 0
  const inventoryValue = items?.reduce((total, item) => total + item.quantityOnHand * item.unitCost, 0) ?? 0

  return <WorkspaceShell action={<Button className="create-button" onClick={() => items?.[0] && openAdjustment(items[0])}><Plus size={17} /> Adjust stock</Button>}>
    <div className="workspace-area">
      <div className="module-hero"><div><p className="eyebrow">INVENTORY CONTROL</p><h1>Inventory</h1><p>Stock health across your operating locations.</p></div><div className="connection-pill"><CheckCircle2 size={15} /> API-backed workspace</div></div>
      {items ? <>
        <section className="module-stat-grid" aria-label="Inventory summary">
          <WorkspaceStatCard description="At weighted unit cost" label="ON-HAND VALUE" value={currency.format(inventoryValue)} />
          <WorkspaceStatCard description="Across 2 warehouses" label="CATALOG ITEMS" value={items.length} />
          <WorkspaceStatCard description={lowStockCount ? "Items need replenishment" : "Stock levels are healthy"} label="REORDER ALERTS" tone={lowStockCount ? "warning" : "default"} value={lowStockCount} />
        </section>
        <Card className="module-panel">
          <CardHeader className="module-toolbar">
            <div><CardTitle>Stock by item</CardTitle><CardDescription>Use a reason and reference for every manual movement.</CardDescription></div>
            <CardAction><Button className="filter-button" size="sm" type="button" variant="outline"><SlidersHorizontal size={15} /> All warehouses</Button></CardAction>
          </CardHeader>
          <CardContent className="module-table-content">
            {items.length ? <Table className="data-table">
              <TableHeader><TableRow><TableHead>ITEM</TableHead><TableHead>WAREHOUSE</TableHead><TableHead>ON HAND</TableHead><TableHead>REORDER LEVEL</TableHead><TableHead>UNIT COST</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
              <TableBody>{items.map((item) => { const low = item.quantityOnHand <= item.reorderLevel; return <TableRow key={item.id}><TableCell><strong>{item.name}</strong><span>{item.sku}</span></TableCell><TableCell>{item.warehouse}</TableCell><TableCell><Badge className={low ? "quantity low" : "quantity"} variant="secondary">{item.quantityOnHand}</Badge></TableCell><TableCell>{item.reorderLevel}</TableCell><TableCell>{currency.format(item.unitCost)}</TableCell><TableCell><Button className="row-action" onClick={() => openAdjustment(item)} size="xs" type="button" variant="secondary">Adjust</Button></TableCell></TableRow> })}</TableBody>
            </Table> : <ApiEmptyState resource="inventory items" />}
          </CardContent>
        </Card>
      </> : error ? <ApiErrorState error={error} onRetry={() => void load()} resource="Inventory" /> : <ApiLoadingState resource="inventory" />}
    </div>
    {selectedItem && <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && setSelectedItem(null)}><form aria-labelledby="adjust-stock-title" className="quick-create-modal form-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={submitAdjustment}><div className="modal-heading"><div><p className="eyebrow">STOCK MOVEMENT</p><h2 id="adjust-stock-title">Adjust {selectedItem.sku}</h2></div><button aria-label="Close" className="icon-button" disabled={saving} onClick={() => setSelectedItem(null)} type="button"><X size={18} /></button></div><p className="form-hint">Current on-hand quantity: <strong>{selectedItem.quantityOnHand}</strong>. Positive adds stock; negative removes it.</p><label>Quantity change<input autoFocus className="form-input" onChange={(event) => setQuantityDelta(event.target.value)} required step="0.001" type="number" value={quantityDelta} /></label><label>Reason<input className="form-input" maxLength={240} onChange={(event) => setReason(event.target.value)} required value={reason} /></label><Button className="form-submit" disabled={saving} type="submit">{Number(quantityDelta) >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}{saving ? "Saving adjustment..." : "Apply adjustment"}</Button></form></div>}
    {notice && <div className="toast" role="status">{notice}</div>}
  </WorkspaceShell>
}
