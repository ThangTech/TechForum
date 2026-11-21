using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public enum AnswerHelpfulFailure
{
    None,
    NotFound,
    OwnAnswer
}

public sealed record AnswerHelpfulResult(AnswerHelpfulDto? Status, AnswerHelpfulFailure Failure)
{
    public static AnswerHelpfulResult Success(AnswerHelpfulDto status) => new(status, AnswerHelpfulFailure.None);
    public static AnswerHelpfulResult Failed(AnswerHelpfulFailure failure) => new(null, failure);
}
