"use client"

import { Bell, Boxes, ChevronDown, CircleDollarSign, FileText, Grid2X2, HelpCircle, LayoutDashboard, Search, Settings, ShoppingCart, Truck, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

const navigation = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Sales orders", href: "/sales-orders", icon: ShoppingCart },
  { label: "Purchases", icon: Truck },
  { label: "Inventory", href: "/inventory", icon: Boxes },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Accounting", icon: CircleDollarSign },
  { label: "Reports", icon: FileText },
]

type WorkspaceShellProps = {
  children: ReactNode
  action?: ReactNode
}

export function WorkspaceShell({ children, action }: WorkspaceShellProps) {
  const pathname = usePathname()

  return (
    <main className="erp-shell">
      <aside className="erp-sidebar">
        <Link className="brand-mark" href="/"><span className="brand-symbol"><Grid2X2 size={17} strokeWidth={2.8} /></span><span>ledgerly</span></Link>
        <div className="workspace-switcher"><span className="workspace-avatar">AK</span><span className="workspace-copy"><strong>Atlas Kenya</strong><small>Operations workspace</small></span><ChevronDown size={15} /></div>
        <nav aria-label="Main navigation" className="main-navigation">
          <p className="nav-label">WORKSPACE</p>
          {navigation.map(({ label, href, icon: Icon }) => href ? (
            <Link className={`nav-item ${pathname === href ? "active" : ""}`} href={href} key={label}><Icon size={17} /><span>{label}</span>{label === "Inventory" && <em>3</em>}</Link>
          ) : (
            <span aria-disabled="true" className="nav-item nav-item-disabled" key={label} title={`${label} is not available yet`}><Icon size={17} /><span>{label}</span><small>Soon</small></span>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span aria-disabled="true" className="nav-item nav-item-disabled" title="Settings is not available yet"><Settings size={17} /><span>Settings</span></span>
          <span aria-disabled="true" className="nav-item nav-item-disabled" title="Help and support is not available yet"><HelpCircle size={17} /><span>Help & support</span></span>
          <div className="user-card"><span className="user-avatar">JM</span><span><strong>Kamau Njoroge</strong><small>Administrator</small></span></div>
        </div>
      </aside>
      <section className="erp-content">
        <header className="topbar">
          <Link className="mobile-brand" href="/"><span className="brand-symbol"><Grid2X2 size={16} /></span> ledgerly</Link>
          <div className="search-control search-disabled"><Search size={18} /><span>Search anything...</span><kbd>Coming soon</kbd></div>
          <div className="topbar-actions"><button aria-label="Notifications" className="icon-button has-notification" type="button"><Bell size={19} /></button>{action}</div>
        </header>
        {children}
      </section>
    </main>
  )
}
