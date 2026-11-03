namespace AdminErp.Api.Contracts;

public sealed record CreateSalesOrderRequest(
    Guid CustomerId,
    IReadOnlyCollection<CreateSalesOrderLineRequest> Lines,
    string Currency = "KES",
    string? ExternalReference = null);

public sealed record CreateSalesOrderLineRequest(Guid InventoryItemId, decimal Quantity, decimal UnitPrice);

public sealed record SalesOrderResponse(
    Guid Id,
    string Number,
    Guid CustomerId,
    string CustomerName,
    string Status,
    decimal Subtotal,
    decimal Tax,
    decimal Total,
    string Currency,
    DateTimeOffset CreatedAt,
    IReadOnlyCollection<SalesOrderLineResponse> Lines);

public sealed record SalesOrderLineResponse(
    Guid InventoryItemId,
    string Description,
    decimal Quantity,
    decimal UnitPrice,
    decimal LineTotal);
