using AdminErp.Api.Application;
using AdminErp.Api.Contracts;

namespace AdminErp.Api.Endpoints;

internal static class EndpointResults
{
    public static IResult Ok<T>(HttpContext context, TimeProvider clock, T value) =>
        Results.Ok(new ApiResponse<T>(value, new ApiMeta(context.TraceIdentifier, clock.GetUtcNow())));

    public static IResult Created<T>(HttpContext context, TimeProvider clock, string location, T value) =>
        Results.Created(location, new ApiResponse<T>(value, new ApiMeta(context.TraceIdentifier, clock.GetUtcNow())));

    public static IResult FromServiceResult<T>(ServiceResult<T> result, HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(result);
        if (result.IsSuccess)
            throw new InvalidOperationException("A successful service result must be returned with an explicit success response.");

        var failure = result.Failure!;
        var statusCode = failure.Kind switch
        {
            FailureKind.Validation => StatusCodes.Status422UnprocessableEntity,
            FailureKind.NotFound => StatusCodes.Status404NotFound,
            FailureKind.Conflict => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status500InternalServerError
        };

        var extensions = new Dictionary<string, object?>
        {
            ["code"] = failure.Code,
            ["requestId"] = context.TraceIdentifier
        };
        if (failure.Fields is { Count: > 0 })
            extensions["fields"] = failure.Fields;

        return Results.Problem(
            statusCode: statusCode,
            title: failure.Message,
            type: $"https://api.ledgerly.local/errors/{failure.Code}",
            extensions: extensions);
    }

    public static IResult InvalidPage(PageQuery page, HttpContext context) =>
        Results.Problem(
            statusCode: StatusCodes.Status422UnprocessableEntity,
            title: $"Page must be greater than zero and pageSize must be between 1 and {PageQuery.MaximumPageSize}.",
            type: "https://api.ledgerly.local/errors/invalid-pagination",
            extensions: new Dictionary<string, object?>
            {
                ["code"] = "invalid_pagination",
                ["requestId"] = context.TraceIdentifier
            });
}
