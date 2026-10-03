using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class AdminAccountService(
    IAdminAccountRepository accountRepository,
    IAdminAuditService auditService,
    TimeProvider timeProvider) : IAdminAccountService
{
    public async Task<PagedResultDto<AdminAccountDto>> GetPageAsync(
        string? keyword,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var result = await accountRepository.GetPageAsync(keyword, page, pageSize, cancellationToken);
        return new PagedResultDto<AdminAccountDto>(
            result.Items.Select(item => Map(item.User, item.IsAdministrator)).ToList(),
            page,
            pageSize,
            result.TotalItems,
            (int)Math.Ceiling(result.TotalItems / (double)pageSize));
    }

    public async Task<AdminAccountWriteResult> SetLockedAsync(
        string targetUserId,
        string administratorId,
        bool isLocked,
        CancellationToken cancellationToken)
    {
        var user = await accountRepository.GetByIdAsync(targetUserId);
        if (user is null)
            return AdminAccountWriteResult.Failed(AdminAccountWriteFailure.NotFound, "Không tìm thấy tài khoản.");
        if (isLocked && targetUserId == administratorId)
            return AdminAccountWriteResult.Failed(AdminAccountWriteFailure.SelfLock, "Quản trị viên không thể tự khóa tài khoản của mình.");

        var isAdministrator = await accountRepository.IsAdministratorAsync(user);
        if (isLocked && isAdministrator)
            return AdminAccountWriteResult.Failed(AdminAccountWriteFailure.AdministratorProtected, "Không thể khóa tài khoản quản trị viên từ chức năng này.");

        var wasLocked = user.LockoutEnd.HasValue && user.LockoutEnd.Value > timeProvider.GetUtcNow();
        var result = await accountRepository.SetLockedAsync(user, isLocked);
        if (!result.Succeeded)
            return AdminAccountWriteResult.Failed(AdminAccountWriteFailure.UpdateFailed, "Không thể cập nhật trạng thái khóa tài khoản.");
        await auditService.RecordAsync(administratorId, isLocked ? "account-locked" : "account-unlocked", "Account",
            user.Id, $"locked={wasLocked}", $"locked={isLocked}",
            isLocked ? "Khóa tài khoản thành viên." : "Mở khóa tài khoản thành viên.", cancellationToken);
        return AdminAccountWriteResult.Success(Map(user, isAdministrator));
    }

    private AdminAccountDto Map(ApplicationUser user, bool isAdministrator) => new(
        user.Id,
        user.DisplayName,
        user.Email ?? string.Empty,
        user.CreatedAtUtc,
        user.LockoutEnd.HasValue && user.LockoutEnd.Value > timeProvider.GetUtcNow(),
        isAdministrator);
}
