using AdminErp.Api.Domain;

namespace AdminErp.Api.Infrastructure;

/// <summary>
/// Development-only persistence adapter. The store is deliberately isolated from
/// application services so it can be replaced with an EF Core implementation.
/// </summary>
public sealed class InMemoryErpStore
{
    private readonly Lock _gate = new();
    private readonly List<Customer> _customers =
    [
        new(Guid.Parse("dd4be459-34a9-4c31-b7b8-502419671e89"), "CUS-1001", "Nuru Foods Ltd.", "accounts@nurufoods.example", "+254 700 111 223", "P051234567A", CustomerStatus.Active, 48_200m, new DateTimeOffset(2026, 8, 3, 0, 0, 0, TimeSpan.Zero)),
        new(Guid.Parse("22cbb9f1-8f0e-4c11-8fef-750a4dfb4233"), "CUS-1002", "Afya Clinics", "finance@afyaclinics.example", "+254 700 333 445", "P051234568B", CustomerStatus.Active, 112_000m, new DateTimeOffset(2026, 8, 7, 0, 0, 0, TimeSpan.Zero)),
        new(Guid.Parse("e7e2f4d4-8b99-4aec-b5a4-f65f123f9719"), "CUS-1003", "Coastline Retail", "hello@coastline.example", null, null, CustomerStatus.Active, 68_750m, new DateTimeOffset(2026, 9, 2, 0, 0, 0, TimeSpan.Zero))
    ];

    private readonly List<InventoryItem> _inventory =
    [
        new(Guid.Parse("d35e112f-959e-42dd-acfe-92aa6e88fa32"), "RICE-5KG", "Premium Rice 5 kg", 124m, 45m, new Money(780m, "KES"), "Nairobi Main"),
        new(Guid.Parse("09193f83-0d6f-4ca2-b02a-c1f7426c6401"), "OIL-1L", "Sunflower Oil 1 L", 19m, 30m, new Money(265m, "KES"), "Nairobi Main"),
        new(Guid.Parse("b9cb5a0b-2e5c-4e87-a061-01c2a1a26e8a"), "SUGAR-2KG", "Brown Sugar 2 kg", 76m, 25m, new Money(350m, "KES"), "Mombasa Depot")
    ];

    private readonly List<SalesOrder> _salesOrders = [];
    private readonly HashSet<string> _stockAdjustmentReferences = new(StringComparer.OrdinalIgnoreCase);

    public IReadOnlyCollection<Customer> GetCustomers()
    {
        lock (_gate)
            return _customers.ToArray();
    }

    public Customer? GetCustomer(Guid id)
    {
        lock (_gate)
            return _customers.FirstOrDefault(customer => customer.Id == id);
    }

    public bool EmailExists(string email)
    {
        lock (_gate)
            return _customers.Any(customer => string.Equals(customer.Email, email, StringComparison.OrdinalIgnoreCase));
    }

    public Customer AddCustomer(string name, string email, string? phone, string? taxNumber, TimeProvider clock)
    {
        lock (_gate)
        {
            var customer = new Customer(
                Guid.NewGuid(),
                $"CUS-{1001 + _customers.Count:D4}",
                name,
                email,
                phone,
                taxNumber,
                CustomerStatus.Active,
                0m,
                clock.GetUtcNow());

            _customers.Add(customer);
            return customer;
        }
    }

    public IReadOnlyCollection<InventoryItem> GetInventory()
    {
        lock (_gate)
            return _inventory.ToArray();
    }

    public InventoryItem? GetInventoryItem(Guid id)
    {
        lock (_gate)
            return _inventory.FirstOrDefault(item => item.Id == id);
    }

    public bool TryAdjustStock(Guid id, decimal quantityDelta, string reference, out InventoryItem? adjustedItem)
    {
        lock (_gate)
        {
            adjustedItem = null;
            var index = _inventory.FindIndex(item => item.Id == id);
            if (index < 0)
                return false;
            if (!_stockAdjustmentReferences.Add(reference))
                return false;

            var item = _inventory[index];
            adjustedItem = item with { QuantityOnHand = decimal.Round(item.QuantityOnHand + quantityDelta, 3, MidpointRounding.ToEven) };
            _inventory[index] = adjustedItem;
            return true;
        }
    }

    public IReadOnlyCollection<SalesOrder> GetSalesOrders()
    {
        lock (_gate)
            return _salesOrders.ToArray();
    }

    public SalesOrder? GetSalesOrder(Guid id)
    {
        lock (_gate)
            return _salesOrders.FirstOrDefault(order => order.Id == id);
    }

    public SalesOrder AddSalesOrder(Guid customerId, IReadOnlyCollection<SalesOrderLine> lines, string? externalReference, TimeProvider clock)
    {
        lock (_gate)
        {
            var order = new SalesOrder(
                Guid.NewGuid(),
                $"SO-{2001 + _salesOrders.Count:D5}",
                customerId,
                SalesOrderStatus.Draft,
                lines,
                clock.GetUtcNow(),
                externalReference);

            _salesOrders.Add(order);
            return order;
        }
    }

    public bool TryConfirmSalesOrder(Guid id, out SalesOrder? confirmedOrder)
    {
        lock (_gate)
        {
            confirmedOrder = null;
            var index = _salesOrders.FindIndex(order => order.Id == id);
            if (index < 0)
                return false;

            var order = _salesOrders[index];
            if (order.Status is not SalesOrderStatus.Draft)
                return false;

            confirmedOrder = order with { Status = SalesOrderStatus.Confirmed };
            _salesOrders[index] = confirmedOrder;
            return true;
        }
    }
}
