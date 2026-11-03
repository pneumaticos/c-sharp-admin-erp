using System.Net.Mail;
using AdminErp.Api.Contracts;
using AdminErp.Api.Domain;
using AdminErp.Api.Infrastructure;
using AdminErp.Api.Models;

namespace AdminErp.Api.Application;

public interface ICustomerService
{
    ValueTask<(IReadOnlyCollection<Customer> Items, int TotalCount)> ListAsync(PageQuery page, string? query, CancellationToken cancellationToken);
    ValueTask<Customer?> GetAsync(Guid id, CancellationToken cancellationToken);
    ValueTask<ServiceResult<Customer>> CreateAsync(CreateCustomerRequest request, CancellationToken cancellationToken);
}

public interface IInventoryService
{
    ValueTask<(IReadOnlyCollection<InventoryItem> Items, int TotalCount)> ListAsync(PageQuery page, string? query, string? warehouse, CancellationToken cancellationToken);
    ValueTask<ServiceResult<InventoryItem>> AdjustAsync(Guid itemId, AdjustStockRequest request, CancellationToken cancellationToken);
}

public interface ISalesOrderService
{
    ValueTask<(IReadOnlyCollection<SalesOrder> Items, int TotalCount)> ListAsync(PageQuery page, CancellationToken cancellationToken);
    ValueTask<ServiceResult<SalesOrder>> GetAsync(Guid id, CancellationToken cancellationToken);
    ValueTask<ServiceResult<SalesOrder>> CreateAsync(CreateSalesOrderRequest request, CancellationToken cancellationToken);
    ValueTask<ServiceResult<SalesOrder>> ConfirmAsync(Guid id, CancellationToken cancellationToken);
}

public interface IDashboardService
{
    ValueTask<DashboardOverview> GetAsync(CancellationToken cancellationToken);
}

public sealed class CustomerService(InMemoryErpStore store, TimeProvider clock) : ICustomerService
{
    public ValueTask<(IReadOnlyCollection<Customer> Items, int TotalCount)> ListAsync(PageQuery page, string? query, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var matchingCustomers = store.GetCustomers()
            .Where(customer => string.IsNullOrWhiteSpace(query) || customer.Name.Contains(query, StringComparison.OrdinalIgnoreCase) || customer.Code.Contains(query, StringComparison.OrdinalIgnoreCase))
            .OrderBy(customer => customer.Code)
            .ToArray();

        return ValueTask.FromResult(((IReadOnlyCollection<Customer>)matchingCustomers.Skip((page.Page - 1) * page.PageSize).Take(page.PageSize).ToArray(), matchingCustomers.Length));
    }

    public ValueTask<Customer?> GetAsync(Guid id, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return ValueTask.FromResult(store.GetCustomer(id));
    }

    public ValueTask<ServiceResult<Customer>> CreateAsync(CreateCustomerRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        var name = request.Name?.Trim();
        var email = request.Email?.Trim();
        if (string.IsNullOrWhiteSpace(name) || name.Length > 120)
            return ValueTask.FromResult(ServiceResult<Customer>.Validation("invalid_customer_name", "Name is required and must not exceed 120 characters.", "name"));

        if (!IsValidEmail(email))
            return ValueTask.FromResult(ServiceResult<Customer>.Validation("invalid_customer_email", "A valid email address is required.", "email"));

        if (store.EmailExists(email!))
            return ValueTask.FromResult(ServiceResult<Customer>.Conflict("customer_email_exists", "A customer with this email already exists."));

        return ValueTask.FromResult(ServiceResult<Customer>.Success(store.AddCustomer(name, email!, request.Phone?.Trim(), request.TaxNumber?.Trim(), clock)));
    }

    private static bool IsValidEmail(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        try { return new MailAddress(value).Address == value; }
        catch (FormatException) { return false; }
    }
}

public sealed class InventoryService(InMemoryErpStore store) : IInventoryService
{
    public ValueTask<(IReadOnlyCollection<InventoryItem> Items, int TotalCount)> ListAsync(PageQuery page, string? query, string? warehouse, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var matchingItems = store.GetInventory()
            .Where(item => string.IsNullOrWhiteSpace(query) || item.Name.Contains(query, StringComparison.OrdinalIgnoreCase) || item.Sku.Contains(query, StringComparison.OrdinalIgnoreCase))
            .Where(item => string.IsNullOrWhiteSpace(warehouse) || string.Equals(item.Warehouse, warehouse, StringComparison.OrdinalIgnoreCase))
            .OrderBy(item => item.Sku)
            .ToArray();

        return ValueTask.FromResult(((IReadOnlyCollection<InventoryItem>)matchingItems.Skip((page.Page - 1) * page.PageSize).Take(page.PageSize).ToArray(), matchingItems.Length));
    }

    public ValueTask<ServiceResult<InventoryItem>> AdjustAsync(Guid itemId, AdjustStockRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();
        if (request.QuantityDelta == 0m)
            return ValueTask.FromResult(ServiceResult<InventoryItem>.Validation("invalid_quantity_delta", "Quantity delta cannot be zero.", "quantityDelta"));
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length > 240)
            return ValueTask.FromResult(ServiceResult<InventoryItem>.Validation("invalid_adjustment_reason", "Reason is required and must not exceed 240 characters.", "reason"));
        if (string.IsNullOrWhiteSpace(request.Reference) || request.Reference.Trim().Length > 80)
            return ValueTask.FromResult(ServiceResult<InventoryItem>.Validation("invalid_adjustment_reference", "Reference is required and must not exceed 80 characters.", "reference"));
        if (store.GetInventoryItem(itemId) is null)
            return ValueTask.FromResult(ServiceResult<InventoryItem>.NotFound("inventory_item_not_found", "The inventory item does not exist."));
        if (!store.TryAdjustStock(itemId, request.QuantityDelta, request.Reference.Trim(), out var item))
            return ValueTask.FromResult(ServiceResult<InventoryItem>.Conflict("duplicate_adjustment_reference", "An adjustment with this reference has already been processed."));

        return ValueTask.FromResult(ServiceResult<InventoryItem>.Success(item!));
    }
}

public sealed class SalesOrderService(InMemoryErpStore store, TimeProvider clock) : ISalesOrderService
{
    public ValueTask<(IReadOnlyCollection<SalesOrder> Items, int TotalCount)> ListAsync(PageQuery page, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var orders = store.GetSalesOrders().OrderByDescending(order => order.CreatedAt).ToArray();
        return ValueTask.FromResult(((IReadOnlyCollection<SalesOrder>)orders.Skip((page.Page - 1) * page.PageSize).Take(page.PageSize).ToArray(), orders.Length));
    }

    public ValueTask<ServiceResult<SalesOrder>> GetAsync(Guid id, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var order = store.GetSalesOrder(id);
        return ValueTask.FromResult(order is null
            ? ServiceResult<SalesOrder>.NotFound("sales_order_not_found", "The sales order does not exist.")
            : ServiceResult<SalesOrder>.Success(order));
    }

    public ValueTask<ServiceResult<SalesOrder>> CreateAsync(CreateSalesOrderRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();
        if (request.Lines is null || request.Lines.Count is 0 or > 100)
            return ValueTask.FromResult(ServiceResult<SalesOrder>.Validation("invalid_order_lines", "An order must include between 1 and 100 lines.", "lines"));
        if (!string.Equals(request.Currency, "KES", StringComparison.OrdinalIgnoreCase))
            return ValueTask.FromResult(ServiceResult<SalesOrder>.Validation("unsupported_currency", "This development API currently supports KES only.", "currency"));
        if (request.ExternalReference?.Trim().Length > 80)
            return ValueTask.FromResult(ServiceResult<SalesOrder>.Validation("invalid_external_reference", "External reference must not exceed 80 characters.", "externalReference"));

        var customer = store.GetCustomer(request.CustomerId);
        if (customer is null)
            return ValueTask.FromResult(ServiceResult<SalesOrder>.NotFound("customer_not_found", "The selected customer does not exist."));
        if (customer.Status is not CustomerStatus.Active)
            return ValueTask.FromResult(ServiceResult<SalesOrder>.Conflict("customer_on_hold", "Sales orders cannot be created for a customer on hold."));

        var itemsById = store.GetInventory().ToDictionary(item => item.Id);
        var lines = new List<SalesOrderLine>(request.Lines.Count);
        foreach (var line in request.Lines)
        {
            if (line.Quantity <= 0m || line.UnitPrice < 0m)
                return ValueTask.FromResult(ServiceResult<SalesOrder>.Validation("invalid_order_line", "Line quantity must be positive and unit price cannot be negative.", "lines"));
            if (!itemsById.TryGetValue(line.InventoryItemId, out var item))
                return ValueTask.FromResult(ServiceResult<SalesOrder>.Validation("unknown_inventory_item", "Every order line must reference an existing inventory item.", "lines.inventoryItemId"));

            lines.Add(new SalesOrderLine(item.Id, item.Name, line.Quantity, new Money(line.UnitPrice, "KES")));
        }

        return ValueTask.FromResult(ServiceResult<SalesOrder>.Success(store.AddSalesOrder(customer.Id, lines, request.ExternalReference?.Trim(), clock)));
    }

    public ValueTask<ServiceResult<SalesOrder>> ConfirmAsync(Guid id, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var existingOrder = store.GetSalesOrder(id);
        if (existingOrder is null)
            return ValueTask.FromResult(ServiceResult<SalesOrder>.NotFound("sales_order_not_found", "The sales order does not exist."));
        if (existingOrder.Status is not SalesOrderStatus.Draft)
            return ValueTask.FromResult(ServiceResult<SalesOrder>.Conflict("sales_order_state_conflict", "Only draft orders can be confirmed."));

        if (!store.TryConfirmSalesOrder(id, out var confirmedOrder))
            return ValueTask.FromResult(ServiceResult<SalesOrder>.Conflict("sales_order_state_conflict", "Only draft orders can be confirmed."));

        return ValueTask.FromResult(ServiceResult<SalesOrder>.Success(confirmedOrder!));
    }
}

public sealed class DashboardService : IDashboardService
{
    public ValueTask<DashboardOverview> GetAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return ValueTask.FromResult(DashboardOverview.Sample());
    }
}
