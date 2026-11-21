using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public enum AcceptAnswerFailure
{
    None,
    NotFound,
    NotQuestion
}

public sealed record AcceptAnswerResult(AnswerDto? Answer, AcceptAnswerFailure Failure)
{
    public static AcceptAnswerResult Success(AnswerDto answer) =>
        new(answer, AcceptAnswerFailure.None);

    public static AcceptAnswerResult Failed(AcceptAnswerFailure failure) =>
        new(null, failure);
}
