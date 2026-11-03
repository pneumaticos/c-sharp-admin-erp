namespace AdminErp.Api.Contracts;

public sealed record CreateCustomerRequest(
    string Name,
    string Email,
    string? Phone,
    string? TaxNumber);

public sealed record CustomerResponse(
    Guid Id,
    string Code,
    string Name,
    string Email,
    string? Phone,
    string Status,
    decimal OutstandingBalance,
    DateTimeOffset CreatedAt);
