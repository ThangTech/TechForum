using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public enum BannedWordFailure
{
    None,
    Validation,
    NotFound,
    Duplicate
}

public sealed record BannedWordWriteResult(
    BannedWordDto? Word,
    BannedWordFailure Failure,
    string? Message)
{
    public static BannedWordWriteResult Success(BannedWordDto word) => new(word, BannedWordFailure.None, null);

    public static BannedWordWriteResult Failed(BannedWordFailure failure, string message) => new(null, failure, message);
}
