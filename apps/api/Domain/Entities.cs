namespace AdminErp.Api.Domain;

public enum CustomerStatus { Active, OnHold }
public enum SalesOrderStatus { Draft, Confirmed, Cancelled }

public sealed record Customer(
    Guid Id,
    string Code,
    string Name,
    string Email,
    string? Phone,
    string? TaxNumber,
    CustomerStatus Status,
    decimal OutstandingBalance,
    DateTimeOffset CreatedAt);

public sealed record InventoryItem(
    Guid Id,
    string Sku,
    string Name,
    decimal QuantityOnHand,
    decimal ReorderLevel,
    Money UnitCost,
    string Warehouse);

public sealed record SalesOrderLine(
    Guid InventoryItemId,
    string Description,
    decimal Quantity,
    Money UnitPrice)
{
    public Money LineTotal => UnitPrice.Multiply(Quantity);
}

public sealed record SalesOrder(
    Guid Id,
    string Number,
    Guid CustomerId,
    SalesOrderStatus Status,
    IReadOnlyCollection<SalesOrderLine> Lines,
    DateTimeOffset CreatedAt,
    string? ExternalReference)
{
    public Money Subtotal => Lines.Aggregate(Money.Zero("KES"), static (total, line) => total.Add(line.LineTotal));
    public Money Tax => new(decimal.Round(Subtotal.Amount * 0.16m, 2, MidpointRounding.ToEven), Subtotal.Currency);
    public Money Total => Subtotal.Add(Tax);
}

public sealed record Money(decimal Amount, string Currency)
{
    public static Money Zero(string currency) => new(0m, currency);

    public Money Add(Money other)
    {
        if (!string.Equals(Currency, other.Currency, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Money values must use the same currency.");

        return new(decimal.Round(Amount + other.Amount, 2, MidpointRounding.ToEven), Currency);
    }

    public Money Multiply(decimal multiplier) => new(decimal.Round(Amount * multiplier, 2, MidpointRounding.ToEven), Currency);
}
