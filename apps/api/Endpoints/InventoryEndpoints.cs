using AdminErp.Api.Application;
using AdminErp.Api.Contracts;
using AdminErp.Api.Domain;

namespace AdminErp.Api.Endpoints;

public static class InventoryEndpoints
{
    public static RouteGroupBuilder MapInventoryEndpoints(this RouteGroupBuilder api)
    {
        var inventory = api.MapGroup("/inventory/items").WithTags("Inventory");

        inventory.MapGet("", async (
            int? page,
            int? pageSize,
            string? q,
            string? warehouse,
            HttpContext context,
            IInventoryService inventoryService,
            CancellationToken cancellationToken) =>
        {
            var query = new PageQuery(page ?? 1, pageSize ?? 25);
            if (!query.IsValid) return EndpointResults.InvalidPage(query, context);

            var result = await inventoryService.ListAsync(query, q, warehouse, cancellationToken);
            return Results.Ok(new PagedResponse<InventoryItemResponse>(result.Items.Select(ToResponse).ToArray(), PageMeta.Create(query.Page, query.PageSize, result.TotalCount)));
        })
        .WithName("ListInventoryItems")
        .Produces<PagedResponse<InventoryItemResponse>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status422UnprocessableEntity);

        inventory.MapPost("/{id:guid}/adjustments", async (
            Guid id,
            AdjustStockRequest request,
            IInventoryService inventoryService,
            HttpContext context,
            TimeProvider clock,
            CancellationToken cancellationToken) =>
        {
            var result = await inventoryService.AdjustAsync(id, request, cancellationToken);
            return result.IsSuccess
                ? EndpointResults.Created(context, clock, $"/api/v1/inventory/items/{id}", ToResponse(result.Value!))
                : EndpointResults.FromServiceResult(result, context);
        })
        .WithName("AdjustInventoryQuantity")
        .Produces<ApiResponse<InventoryItemResponse>>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict)
        .ProducesProblem(StatusCodes.Status422UnprocessableEntity);

        return api;
    }

    internal static InventoryItemResponse ToResponse(InventoryItem item) => new(
        item.Id,
        item.Sku,
        item.Name,
        item.QuantityOnHand,
        item.ReorderLevel,
        item.UnitCost.Amount,
        item.UnitCost.Currency,
        item.Warehouse);
}
