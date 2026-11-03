using AdminErp.Api.Application;

namespace AdminErp.Api.Endpoints;

public static class DashboardEndpoints
{
    public static RouteGroupBuilder MapDashboardEndpoints(this RouteGroupBuilder api)
    {
        var dashboard = api.MapGroup("/dashboard").WithTags("Dashboard");

        dashboard.MapGet("", async (
            IDashboardService dashboardService,
            HttpContext context,
            TimeProvider clock,
            CancellationToken cancellationToken) =>
        {
            var overview = await dashboardService.GetAsync(cancellationToken);
            return EndpointResults.Ok(context, clock, overview);
        })
        .WithName("GetDashboardOverview")
        .Produces(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status500InternalServerError);

        return api;
    }
}
