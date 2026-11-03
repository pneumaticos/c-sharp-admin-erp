using AdminErp.Api.Application;
using AdminErp.Api.Contracts;
using AdminErp.Api.Domain;

namespace AdminErp.Api.Endpoints;

public static class SalesOrderEndpoints
{
    public static RouteGroupBuilder MapSalesOrderEndpoints(this RouteGroupBuilder api)
    {
        var salesOrders = api.MapGroup("/sales-orders").WithTags("Sales orders");

        salesOrders.MapGet("", async (
            int? page,
            int? pageSize,
            HttpContext context,
            ISalesOrderService salesOrderService,
            ICustomerService customerService,
            CancellationToken cancellationToken) =>
        {
            var query = new PageQuery(page ?? 1, pageSize ?? 25);
            if (!query.IsValid) return EndpointResults.InvalidPage(query, context);

            var result = await salesOrderService.ListAsync(query, cancellationToken);
            var customerNames = await Task.WhenAll(result.Items.Select(async order =>
                (await customerService.GetAsync(order.CustomerId, cancellationToken))?.Name ?? "Unknown customer"));
            var items = result.Items.Zip(customerNames, ToResponse).ToArray();
            return Results.Ok(new PagedResponse<SalesOrderResponse>(items, PageMeta.Create(query.Page, query.PageSize, result.TotalCount)));
        })
        .WithName("ListSalesOrders")
        .Produces<PagedResponse<SalesOrderResponse>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status422UnprocessableEntity);

        salesOrders.MapGet("/{id:guid}", async (
            Guid id,
            ISalesOrderService salesOrderService,
            ICustomerService customerService,
            HttpContext context,
            TimeProvider clock,
            CancellationToken cancellationToken) =>
        {
            var result = await salesOrderService.GetAsync(id, cancellationToken);
            if (!result.IsSuccess) return EndpointResults.FromServiceResult(result, context);

            var customer = await customerService.GetAsync(result.Value!.CustomerId, cancellationToken);
            return EndpointResults.Ok(context, clock, ToResponse(result.Value!, customer?.Name ?? "Unknown customer"));
        })
        .WithName("GetSalesOrder")
        .Produces<ApiResponse<SalesOrderResponse>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound);

        salesOrders.MapPost("", async (
            CreateSalesOrderRequest request,
            ISalesOrderService salesOrderService,
            ICustomerService customerService,
            HttpContext context,
            TimeProvider clock,
            CancellationToken cancellationToken) =>
        {
            var result = await salesOrderService.CreateAsync(request, cancellationToken);
            if (!result.IsSuccess) return EndpointResults.FromServiceResult(result, context);

            var customer = await customerService.GetAsync(result.Value!.CustomerId, cancellationToken);
            return EndpointResults.Created(context, clock, $"/api/v1/sales-orders/{result.Value.Id}", ToResponse(result.Value, customer?.Name ?? "Unknown customer"));
        })
        .WithName("CreateSalesOrder")
        .Produces<ApiResponse<SalesOrderResponse>>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict)
        .ProducesProblem(StatusCodes.Status422UnprocessableEntity);

        salesOrders.MapPost("/{id:guid}/confirm", async (
            Guid id,
            ISalesOrderService salesOrderService,
            ICustomerService customerService,
            HttpContext context,
            TimeProvider clock,
            CancellationToken cancellationToken) =>
        {
            var result = await salesOrderService.ConfirmAsync(id, cancellationToken);
            if (!result.IsSuccess) return EndpointResults.FromServiceResult(result, context);

            var customer = await customerService.GetAsync(result.Value!.CustomerId, cancellationToken);
            return EndpointResults.Ok(context, clock, ToResponse(result.Value, customer?.Name ?? "Unknown customer"));
        })
        .WithName("ConfirmSalesOrder")
        .Produces<ApiResponse<SalesOrderResponse>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);

        return api;
    }

    private static SalesOrderResponse ToResponse(SalesOrder order, string customerName) => new(
        order.Id,
        order.Number,
        order.CustomerId,
        customerName,
        order.Status.ToString(),
        order.Subtotal.Amount,
        order.Tax.Amount,
        order.Total.Amount,
        order.Total.Currency,
        order.CreatedAt,
        order.Lines.Select(line => new SalesOrderLineResponse(line.InventoryItemId, line.Description, line.Quantity, line.UnitPrice.Amount, line.LineTotal.Amount)).ToArray());
}
