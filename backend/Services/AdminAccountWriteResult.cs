using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public enum AdminAccountWriteFailure
{
    None,
    NotFound,
    SelfLock,
    AdministratorProtected,
    UpdateFailed
}

public sealed record AdminAccountWriteResult(
    AdminAccountDto? Account,
    AdminAccountWriteFailure Failure,
    string? Message)
{
    public static AdminAccountWriteResult Success(AdminAccountDto account) =>
        new(account, AdminAccountWriteFailure.None, null);

    public static AdminAccountWriteResult Failed(AdminAccountWriteFailure failure, string message) =>
        new(null, failure, message);
}
