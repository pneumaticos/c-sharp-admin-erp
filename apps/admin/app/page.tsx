"use client"

import {
  ArrowDownRight, ArrowUpRight, Bell, BookOpen, Boxes, ChevronDown,
  CircleDollarSign, ClipboardList, Command, FileText, Grid2X2, HelpCircle,
  LayoutDashboard, MoreHorizontal, Package, Plus, Search, Settings,
  ShoppingCart, Truck, Users, X,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@workspace/ui/components/button"

const navigation = [
  { label: "Overview", icon: LayoutDashboard }, { label: "Sales", icon: ShoppingCart },
  { label: "Purchases", icon: Truck }, { label: "Inventory", icon: Boxes, badge: "3" },
  { label: "Customers", icon: Users }, { label: "Accounting", icon: CircleDollarSign },
  { label: "Reports", icon: FileText },
]

const activities = [
  ["Payment received", "KCB Bank · INV-2048", "+ KSh 84,500", "12 min ago", "success"],
  ["Purchase order approved", "PO-1087 · Nairobi Supplies Ltd.", "KSh 126,000", "43 min ago", "neutral"],
  ["Stock threshold reached", "3 items require attention", "Review stock", "1 hr ago", "warning"],
]

const invoices = [
  ["INV-2052", "Nuru Foods Ltd.", "Today", "KSh 48,200", "Due today"],
  ["INV-2049", "Afya Clinics", "31 Oct", "KSh 112,000", "Sent"],
  ["INV-2044", "Coastline Retail", "02 Nov", "KSh 68,750", "Sent"],
  ["INV-2038", "Bluewave Distributors", "25 Oct", "KSh 39,500", "Overdue"],
]

export default function Page() {
  const [activeItem, setActiveItem] = useState("Overview")
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const notify = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(null), 3600)
  }

  return (
    <main className="erp-shell">
      <aside className="erp-sidebar">
        <div className="brand-mark" aria-label="Ledgerly home"><span className="brand-symbol"><Grid2X2 size={17} strokeWidth={2.8} /></span><span>ledgerly</span></div>
        <div className="workspace-switcher"><span className="workspace-avatar">AK</span><span className="workspace-copy"><strong>Atlas Kenya</strong><small>Operations workspace</small></span><ChevronDown size={15} /></div>
        <nav aria-label="Main navigation" className="main-navigation">
          <p className="nav-label">WORKSPACE</p>
          {navigation.map(({ label, icon: Icon, badge }) => <button className={`nav-item ${activeItem === label ? "active" : ""}`} key={label} onClick={() => { setActiveItem(label); if (label !== "Overview") notify(`${label} workspace is ready for its API module.`) }} type="button"><Icon size={17} /><span>{label}</span>{badge && <em>{badge}</em>}</button>)}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => notify("Settings will open in a dedicated workspace.")} type="button"><Settings size={17} /><span>Settings</span></button>
          <button className="nav-item" onClick={() => notify("Help center opened in a new panel.")} type="button"><HelpCircle size={17} /><span>Help & support</span></button>
          <div className="user-card"><span className="user-avatar">JM</span><span><strong>Jane Mwangi</strong><small>Administrator</small></span><MoreHorizontal size={18} /></div>
        </div>
      </aside>
      <section className="erp-content">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-symbol"><Grid2X2 size={16} /></span> ledgerly</div>
          <button className="search-control" onClick={() => notify("Global search is connected to the API search endpoint.")} type="button"><Search size={18} /><span>Search anything...</span><kbd><Command size={12} /> K</kbd></button>
          <div className="topbar-actions"><button aria-label="Notifications" className="icon-button has-notification" onClick={() => notify("You have 3 unread notifications.")} type="button"><Bell size={19} /></button><Button className="create-button" onClick={() => setIsQuickCreateOpen(true)}><Plus size={17} /> Create</Button></div>
        </header>
        <div className="dashboard-area">
          <div className="page-heading"><div><p className="eyebrow">WEDNESDAY, 29 OCTOBER</p><h1>Good morning, Jane <span>✦</span></h1><p className="subheading">Here&apos;s what needs your attention today.</p></div><button className="period-selector" onClick={() => notify("Reporting period: 1–29 October 2026.")} type="button">This month <ChevronDown size={15} /></button></div>
          <section className="metrics-grid" aria-label="Business performance summary">
            <article className="metric-card revenue"><div className="metric-top"><span className="metric-icon"><CircleDollarSign size={19} /></span><span className="trend up"><ArrowUpRight size={14} /> 12.5%</span></div><p>Revenue</p><h2>KSh 2.84M</h2><small>vs KSh 2.52M last month</small><div className="sparkline" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</div></article>
            <article className="metric-card receivables"><div className="metric-top"><span className="metric-icon"><ClipboardList size={19} /></span><span className="trend down"><ArrowDownRight size={14} /> 4.2%</span></div><p>Receivables</p><h2>KSh 684,300</h2><small>14 invoices awaiting payment</small><div className="metric-foot"><span>Overdue <b>KSh 118,400</b></span><button onClick={() => notify("Opening outstanding invoices.")} type="button">View aging <ArrowUpRight size={13} /></button></div></article>
            <article className="metric-card inventory"><div className="metric-top"><span className="metric-icon"><Package size={19} /></span><span className="stock-count">1,248 SKUs</span></div><p>Inventory value</p><h2>KSh 1.96M</h2><small>Across 2 warehouses</small><div className="metric-foot"><span className="low-stock"><i />3 low-stock items</span><button onClick={() => notify("Opening stock health report.")} type="button">Review <ArrowUpRight size={13} /></button></div></article>
          </section>
          <section className="dashboard-grid">
            <article className="panel cashflow-panel"><div className="panel-heading"><div><h2>Cash flow</h2><p>Money in and out this month</p></div><button className="more-button" aria-label="Cash flow options" type="button"><MoreHorizontal size={19} /></button></div><div className="cashflow-summary"><div><strong>KSh 2,842,000</strong><span className="legend incoming">Incoming</span></div><div><strong>KSh 1,764,000</strong><span className="legend outgoing">Outgoing</span></div></div><div className="chart-wrap" role="img" aria-label="Cash flow chart showing incoming cash higher than outgoing cash through October"><div className="chart-y"><span>1M</span><span>750K</span><span>500K</span><span>250K</span><span>0</span></div><div><svg className="cashflow-chart" viewBox="0 0 650 220" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="cashFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#1e9b74" stopOpacity=".22"/><stop offset="100%" stopColor="#1e9b74" stopOpacity="0"/></linearGradient></defs><path className="grid-line" d="M0 20H650M0 70H650M0 120H650M0 170H650M0 219H650" /><path d="M0 180 C30 160 43 153 65 163 S107 153 130 140 S168 155 196 134 S237 106 260 120 S303 92 325 102 S366 68 390 78 S430 109 455 93 S494 35 520 53 S564 64 585 45 S624 23 650 36 L650 220 L0 220Z" fill="url(#cashFill)" /><path className="incoming-line" d="M0 180 C30 160 43 153 65 163 S107 153 130 140 S168 155 196 134 S237 106 260 120 S303 92 325 102 S366 68 390 78 S430 109 455 93 S494 35 520 53 S564 64 585 45 S624 23 650 36" /><path className="outgoing-line" d="M0 191 C24 184 45 181 65 189 S107 179 130 181 S170 170 196 176 S237 164 260 173 S300 150 325 158 S367 143 390 151 S430 140 455 146 S494 117 520 135 S560 116 585 128 S625 103 650 110" /></svg><div className="chart-x"><span>1 Oct</span><span>7 Oct</span><span>14 Oct</span><span>21 Oct</span><span>28 Oct</span></div></div></div></article>
            <article className="panel activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Latest changes across your business</p></div><button className="text-action" onClick={() => notify("Showing the full audit trail.")} type="button">View all</button></div><div className="activity-list">{activities.map(([title, detail, amount, time, tone]) => <div className="activity" key={title}><span className={`activity-dot ${tone}`} /><div><strong>{title}</strong><p>{detail}</p></div><div className="activity-meta"><strong>{amount}</strong><small>{time}</small></div></div>)}</div></article>
            <article className="panel invoices-panel"><div className="panel-heading"><div><h2>Invoices due</h2><p>Keep cash moving with timely follow-up</p></div><button className="text-action" onClick={() => notify("Opening all invoices.")} type="button">View invoices</button></div><div className="table-scroll"><table><thead><tr><th>INVOICE</th><th>CUSTOMER</th><th>DUE</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>{invoices.map(([number = "", customer = "", due = "", amount = "", state = ""]) => <tr key={number}><td><strong>{number}</strong></td><td>{customer}</td><td>{due}</td><td><strong>{amount}</strong></td><td><span className={`status ${state.toLowerCase().replace(" ", "-")}`}>{state}</span></td></tr>)}</tbody></table></div></article>
            <article className="panel attention-panel"><div className="attention-header"><span className="attention-icon"><Bell size={17} /></span><div><h2>Needs attention</h2><p>Resolve these to keep operations moving.</p></div></div>{[["Inventory", "3 items below reorder level", "Review"], ["Receivables", "1 invoice is 4 days overdue", "Follow up"], ["Purchases", "2 orders need approval", "Approve"]].map(([area = "", message = "", action = ""]) => <div className="attention-item" key={area}><span>{area}</span><strong>{message}</strong><button onClick={() => notify(`Opening ${area.toLowerCase()} work queue.`)} type="button">{action}</button></div>)}</article>
          </section>
        </div>
      </section>
      {isQuickCreateOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsQuickCreateOpen(false)}><section aria-labelledby="quick-create-title" className="quick-create-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true"><div className="modal-heading"><div><p className="eyebrow">QUICK ACTION</p><h2 id="quick-create-title">Create new</h2></div><button aria-label="Close" className="icon-button" onClick={() => setIsQuickCreateOpen(false)} type="button"><X size={18} /></button></div><div className="quick-actions">{[[FileText, "Invoice", "Bill a customer"], [Truck, "Purchase order", "Order from a supplier"], [Package, "Inventory item", "Add a product or service"], [Users, "Customer", "Add a customer record"]].map(([Icon, title, description]) => { const ActionIcon = Icon as typeof FileText; return <button key={title as string} onClick={() => { setIsQuickCreateOpen(false); notify(`New ${String(title).toLowerCase()} created.`) }} type="button"><ActionIcon size={20} /><span><strong>{title as string}</strong><small>{description as string}</small></span></button> })}</div></section></div>}
      {notice && <div className="toast" role="status"><BookOpen size={17} />{notice}</div>}
    </main>
  )
}
