using System.Diagnostics;

namespace AdminErp.Api.Middleware;

public sealed class RequestContextMiddleware(RequestDelegate next, ILogger<RequestContextMiddleware> logger)
{
    private const string RequestIdHeader = "X-Request-Id";

    public async Task InvokeAsync(HttpContext context)
    {
        var requestId = context.Request.Headers[RequestIdHeader].FirstOrDefault();
        context.TraceIdentifier = string.IsNullOrWhiteSpace(requestId)
            ? Activity.Current?.Id ?? Guid.NewGuid().ToString("N")
            : requestId;
        context.Response.Headers[RequestIdHeader] = context.TraceIdentifier;

        using (logger.BeginScope(new Dictionary<string, object> { ["RequestId"] = context.TraceIdentifier }))
        {
            await next(context);
        }
    }
}
