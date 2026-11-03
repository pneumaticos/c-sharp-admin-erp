namespace AdminErp.Api.Application;

public enum FailureKind { Validation, NotFound, Conflict }

public sealed record ServiceFailure(FailureKind Kind, string Code, string Message, IReadOnlyCollection<string>? Fields = null);

public sealed record ServiceResult<T>(T? Value, ServiceFailure? Failure)
{
    public bool IsSuccess => Failure is null;

    public static ServiceResult<T> Success(T value) => new(value, null);
    public static ServiceResult<T> Validation(string code, string message, params string[] fields) =>
        new(default, new ServiceFailure(FailureKind.Validation, code, message, fields));
    public static ServiceResult<T> NotFound(string code, string message) =>
        new(default, new ServiceFailure(FailureKind.NotFound, code, message));
    public static ServiceResult<T> Conflict(string code, string message) =>
        new(default, new ServiceFailure(FailureKind.Conflict, code, message));
}
