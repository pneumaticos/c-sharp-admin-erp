namespace AdminErp.Api.Contracts;

public sealed record InventoryItemResponse(
    Guid Id,
    string Sku,
    string Name,
    decimal QuantityOnHand,
    decimal ReorderLevel,
    decimal UnitCost,
    string Currency,
    string Warehouse);

public sealed record AdjustStockRequest(
    decimal QuantityDelta,
    string Reason,
    string Reference);
