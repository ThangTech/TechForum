using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public enum CreateAnswerFailure
{
    None,
    TopicNotFound,
    DiscussionLocked,
    Validation,
    RateLimited
}

public sealed record CreateAnswerResult(
    AnswerDto? Answer,
    CreateAnswerFailure Failure,
    string? Field,
    string? Message,
    int RetryAfterSeconds = 0)
{
    public bool Succeeded => Answer is not null;

    public static CreateAnswerResult Success(AnswerDto answer) =>
        new(answer, CreateAnswerFailure.None, null, null);

    public static CreateAnswerResult Failed(
        CreateAnswerFailure failure,
        string message,
        string? field = null) =>
        new(null, failure, field, message);

    public static CreateAnswerResult Limited(int retryAfterSeconds) =>
        new(null, CreateAnswerFailure.RateLimited, null, null, retryAfterSeconds);
}
