using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public enum TagWriteFailure
{
    None,
    Validation,
    NotFound,
    DuplicateSlug
}

public sealed record TagWriteResult(
    AdminTagDto? Tag,
    TagWriteFailure Failure,
    string? Field,
    string? Message)
{
    public static TagWriteResult Success(AdminTagDto tag) =>
        new(tag, TagWriteFailure.None, null, null);

    public static TagWriteResult Failed(TagWriteFailure failure, string message, string? field = null) =>
        new(null, failure, field, message);
}
