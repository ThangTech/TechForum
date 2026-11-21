using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public enum AdminAccountWriteFailure
{
    None,
    NotFound,
    SelfLock,
    AdministratorProtected,
    Validation,
    UpdateFailed
}

public sealed record AdminAccountWriteResult(
    AdminAccountDto? Account,
    AdminAccountWriteFailure Failure,
    string? Message,
    string? Field = null)
{
    public static AdminAccountWriteResult Success(AdminAccountDto account) =>
        new(account, AdminAccountWriteFailure.None, null);

    public static AdminAccountWriteResult Failed(AdminAccountWriteFailure failure, string message, string? field = null) =>
        new(null, failure, message, field);
}
