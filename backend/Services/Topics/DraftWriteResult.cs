using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public enum DraftWriteFailure
{
    None,
    Validation,
    NotFound
}

public sealed record DraftWriteResult(
    DraftDto? Draft,
    DraftWriteFailure Failure,
    string? Field,
    string? Message)
{
    public static DraftWriteResult Success(DraftDto draft) =>
        new(draft, DraftWriteFailure.None, null, null);

    public static DraftWriteResult Failed(DraftWriteFailure failure, string message, string? field = null) =>
        new(null, failure, field, message);
}
