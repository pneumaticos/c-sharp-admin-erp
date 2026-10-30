# Admin ERP architecture

```text
apps/admin (Next.js 16, React)  ── HTTPS JSON ──>  apps/api (ASP.NET Core / .NET 10)
         operations dashboard                    application API
```

## First vertical slice

`GET /api/v1/dashboard` provides the overview surface used by the admin home. It returns development seed data so the interface can be reviewed before a database is chosen. The response separates financial metrics, cash flow, activity, and invoice summaries.

## Planned bounded contexts

- **Identity & access:** users, roles, companies, locations and audit trail.
- **Sales:** customers, quotations, sales orders, invoices, credit notes and payments.
- **Purchasing:** suppliers, requests, purchase orders, receipts and bills.
- **Inventory:** item catalog, warehouses, stock movements, reservations and reorder policies.
- **Accounting:** chart of accounts, journals, fiscal periods, tax and reconciliation.

Each context should own its write model and database migrations. Cross-context dashboards should be read models or query projections, not UI joins. Add authentication before exposing the API beyond the local development origin.

## Running locally

```powershell
dotnet run --project apps/api
pnpm --filter admin dev
```

The API runs on `https://localhost:7049` (or `http://localhost:5049`) and permits the Next development server origin configured in `apps/api/appsettings.json`.
