using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public enum CreateAnswerFailure
{
    None,
    TopicNotFound,
    DiscussionLocked,
    Validation
}

public sealed record CreateAnswerResult(
    AnswerDto? Answer,
    CreateAnswerFailure Failure,
    string? Field,
    string? Message)
{
    public bool Succeeded => Answer is not null;

    public static CreateAnswerResult Success(AnswerDto answer) =>
        new(answer, CreateAnswerFailure.None, null, null);

    public static CreateAnswerResult Failed(
        CreateAnswerFailure failure,
        string message,
        string? field = null) =>
        new(null, failure, field, message);
}
