namespace TechForum.Api.Services;

// Loại lỗi dùng chung cho mọi service. Mỗi loại ứng với một mã HTTP (xem ResultExtensions).
public enum ErrorType
{
    Validation,
    Unauthorized,
    Forbidden,
    NotFound,
    Conflict,
    Locked,
    TooManyRequests,
    Unavailable
}

// Kết quả của một thao tác: thành công, hoặc lỗi kèm tiêu đề và lời giải thích cho người dùng.
public class Result
{
    protected Result(ErrorType? error, string? title, string? message, string? field, int retryAfterSeconds)
    {
        Error = error;
        Title = title;
        Message = message;
        Field = field;
        RetryAfterSeconds = retryAfterSeconds;
    }

    public ErrorType? Error { get; }
    public string? Title { get; }
    public string? Message { get; }
    public string? Field { get; }
    public int RetryAfterSeconds { get; }

    public bool Succeeded => Error is null;

    public static Result Success()
    {
        return new Result(null, null, null, null, 0);
    }

    public static Result Fail(ErrorType error, string? title, string? message = null, string? field = null)
    {
        return new Result(error, title, message, field, 0);
    }

    // Dữ liệu gửi lên sai ở một trường: trả 400 kèm lỗi của trường đó.
    public static Result Invalid(string field, string message)
    {
        return new Result(ErrorType.Validation, null, message, field, 0);
    }

    public static Result TooManyRequests(string title, string message, int retryAfterSeconds)
    {
        return new Result(ErrorType.TooManyRequests, title, message, null, retryAfterSeconds);
    }
}

public sealed class Result<T> : Result
{
    private Result(T? value, ErrorType? error, string? title, string? message, string? field, int retryAfterSeconds)
        : base(error, title, message, field, retryAfterSeconds)
    {
        Value = value;
    }

    public T? Value { get; }

    public static Result<T> Success(T value)
    {
        return new Result<T>(value, null, null, null, null, 0);
    }

    public static new Result<T> Fail(ErrorType error, string? title, string? message = null, string? field = null)
    {
        return new Result<T>(default, error, title, message, field, 0);
    }

    public static new Result<T> Invalid(string field, string message)
    {
        return new Result<T>(default, ErrorType.Validation, null, message, field, 0);
    }

    public static new Result<T> TooManyRequests(string title, string message, int retryAfterSeconds)
    {
        return new Result<T>(default, ErrorType.TooManyRequests, title, message, null, retryAfterSeconds);
    }

    // Chuyển lỗi của một bước trước sang kết quả có kiểu khác.
    public static Result<T> From(Result failure)
    {
        return new Result<T>(default, failure.Error, failure.Title, failure.Message, failure.Field, failure.RetryAfterSeconds);
    }
}
