using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public enum CategoryWriteFailure
{
    None,
    Validation,
    NotFound,
    DuplicateSlug
}

public sealed record CategoryWriteResult(
    AdminCategoryDto? Category,
    CategoryWriteFailure Failure,
    string? Field,
    string? Message)
{
    public static CategoryWriteResult Success(AdminCategoryDto category) =>
        new(category, CategoryWriteFailure.None, null, null);

    public static CategoryWriteResult Failed(
        CategoryWriteFailure failure,
        string message,
        string? field = null) => new(null, failure, field, message);
}
