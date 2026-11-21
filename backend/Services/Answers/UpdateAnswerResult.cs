using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public enum UpdateAnswerFailure { None, Validation, NotFound }

public sealed record UpdateAnswerResult(
    AnswerDto? Answer,
    UpdateAnswerFailure Failure,
    string? Field,
    string? Message)
{
    public static UpdateAnswerResult Success(AnswerDto answer) =>
        new(answer, UpdateAnswerFailure.None, null, null);
    public static UpdateAnswerResult Failed(
        UpdateAnswerFailure failure,
        string message,
        string? field = null) => new(null, failure, field, message);
}
