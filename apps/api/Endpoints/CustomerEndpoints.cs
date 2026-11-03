using AdminErp.Api.Application;
using AdminErp.Api.Contracts;
using AdminErp.Api.Domain;

namespace AdminErp.Api.Endpoints;

public static class CustomerEndpoints
{
    public static RouteGroupBuilder MapCustomerEndpoints(this RouteGroupBuilder api)
    {
        var customers = api.MapGroup("/customers").WithTags("Customers");

        customers.MapGet("", async (
            int? page,
            int? pageSize,
            string? q,
            HttpContext context,
            ICustomerService customerService,
            CancellationToken cancellationToken) =>
        {
            var query = new PageQuery(page ?? 1, pageSize ?? 25);
            if (!query.IsValid) return EndpointResults.InvalidPage(query, context);

            var result = await customerService.ListAsync(query, q, cancellationToken);
            return Results.Ok(new PagedResponse<CustomerResponse>(result.Items.Select(ToResponse).ToArray(), PageMeta.Create(query.Page, query.PageSize, result.TotalCount)));
        })
        .WithName("ListCustomers")
        .Produces<PagedResponse<CustomerResponse>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status422UnprocessableEntity);

        customers.MapGet("/{id:guid}", async (
            Guid id,
            ICustomerService customerService,
            HttpContext context,
            TimeProvider clock,
            CancellationToken cancellationToken) =>
        {
            var customer = await customerService.GetAsync(id, cancellationToken);
            return customer is null
                ? Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Customer not found.", type: "https://api.ledgerly.local/errors/customer-not-found")
                : EndpointResults.Ok(context, clock, ToResponse(customer));
        })
        .WithName("GetCustomer")
        .Produces<ApiResponse<CustomerResponse>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound);

        customers.MapPost("", async (
            CreateCustomerRequest request,
            ICustomerService customerService,
            HttpContext context,
            TimeProvider clock,
            CancellationToken cancellationToken) =>
        {
            var result = await customerService.CreateAsync(request, cancellationToken);
            return result.IsSuccess
                ? EndpointResults.Created(context, clock, $"/api/v1/customers/{result.Value!.Id}", ToResponse(result.Value!))
                : EndpointResults.FromServiceResult(result, context);
        })
        .WithName("CreateCustomer")
        .Produces<ApiResponse<CustomerResponse>>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status409Conflict)
        .ProducesProblem(StatusCodes.Status422UnprocessableEntity);

        return api;
    }

    internal static CustomerResponse ToResponse(Customer customer) => new(
        customer.Id,
        customer.Code,
        customer.Name,
        customer.Email,
        customer.Phone,
        customer.Status.ToString(),
        customer.OutstandingBalance,
        customer.CreatedAt);
}
