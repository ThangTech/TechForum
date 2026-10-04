namespace TechForum.Api.Services;

public enum SoftDeleteTopicFailure
{
    None,
    NotFound,
    HasPublicAnswers
}

public sealed record SoftDeleteTopicResult(SoftDeleteTopicFailure Failure)
{
    public bool Succeeded => Failure == SoftDeleteTopicFailure.None;

    public static SoftDeleteTopicResult Success() => new(SoftDeleteTopicFailure.None);

    public static SoftDeleteTopicResult Failed(SoftDeleteTopicFailure failure) => new(failure);
}
