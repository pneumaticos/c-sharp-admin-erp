namespace AdminErp.Api.Contracts;

public sealed record ApiResponse<T>(T Data, ApiMeta? Meta = null);

public sealed record ApiMeta(string RequestId, DateTimeOffset GeneratedAt);

public sealed record PagedResponse<T>(IReadOnlyCollection<T> Data, PageMeta Meta);

public sealed record PageMeta(int Page, int PageSize, int TotalCount, int TotalPages)
{
    public static PageMeta Create(int page, int pageSize, int totalCount) => new(
        page,
        pageSize,
        totalCount,
        Math.Max(1, (int)Math.Ceiling(totalCount / (double)pageSize)));
}

public sealed record ValidationIssue(string Field, string Message, string Code);

public sealed record PageQuery(int Page = 1, int PageSize = 25)
{
    public const int MaximumPageSize = 100;

    public bool IsValid => Page > 0 && PageSize is > 0 and <= MaximumPageSize;
}
