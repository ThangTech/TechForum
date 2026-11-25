using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IAdminAccountService
{
    Task<PagedResultDto<AdminAccountDto>> GetPageAsync(
        string? keyword,
        string? status,
        string? role,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
    Task<Result<AdminAccountDto>> SetLockedAsync(
        string targetUserId,
        string administratorId,
        SetAccountLockRequest request,
        CancellationToken cancellationToken);
    Task<Result<AdminAccountDto>> SetRoleAsync(
        string targetUserId,
        string administratorId,
        SetAccountRoleRequest request,
        CancellationToken cancellationToken);
}
