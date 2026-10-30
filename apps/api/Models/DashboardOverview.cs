namespace AdminErp.Api.Models;

public sealed record DashboardOverview(
    Metric Revenue,
    Metric Receivables,
    Metric Inventory,
    IReadOnlyCollection<CashFlowPoint> CashFlow,
    IReadOnlyCollection<ActivityItem> Activities,
    IReadOnlyCollection<InvoiceSummary> Invoices)
{
    // Development seed data. Replace this with application queries when the
    // accounting, sales, purchasing, and inventory contexts are introduced.
    public static DashboardOverview Sample() => new(
        new Metric(2_842_000m, 12.5m, "KSh", "vs KSh 2.52M last month"),
        new Metric(684_300m, -4.2m, "KSh", "14 invoices awaiting payment"),
        new Metric(1_960_000m, null, "KSh", "Across 2 warehouses"),
        [
            new("2026-10-01", 180_000m, 120_000m), new("2026-10-07", 310_000m, 190_000m),
            new("2026-10-14", 455_000m, 275_000m), new("2026-10-21", 620_000m, 350_000m),
            new("2026-10-28", 818_000m, 505_000m)
        ],
        [
            new("Payment received", "KCB Bank · INV-2048", "+ KSh 84,500", "12 min ago", "success"),
            new("Purchase order approved", "PO-1087 · Nairobi Supplies Ltd.", "KSh 126,000", "43 min ago", "neutral"),
            new("Stock threshold reached", "3 items require attention", "Review stock", "1 hr ago", "warning")
        ],
        [
            new("INV-2052", "Nuru Foods Ltd.", "2026-10-29", 48_200m, "due-today"),
            new("INV-2049", "Afya Clinics", "2026-10-31", 112_000m, "sent"),
            new("INV-2044", "Coastline Retail", "2026-11-02", 68_750m, "sent"),
            new("INV-2038", "Bluewave Distributors", "2026-10-25", 39_500m, "overdue")
        ]);
}

public sealed record Metric(decimal Value, decimal? ChangePercent, string Currency, string Context);
public sealed record CashFlowPoint(string Date, decimal Incoming, decimal Outgoing);
public sealed record ActivityItem(string Title, string Detail, string Value, string OccurredAt, string Tone);
public sealed record InvoiceSummary(string Number, string Customer, string DueDate, decimal Amount, string Status);
