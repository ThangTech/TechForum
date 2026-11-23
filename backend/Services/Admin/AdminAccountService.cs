using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class AdminAccountService : IAdminAccountService
{
    private readonly IAdminAccountRepository accountRepository;
    private readonly TimeProvider timeProvider;

    public AdminAccountService(IAdminAccountRepository accountRepository, TimeProvider timeProvider)
    {
        this.accountRepository = accountRepository;
        this.timeProvider = timeProvider;
    }

    // "locked"/"unlocked" thành true/false; để trống thì không lọc.
    private static bool? ParseFilter(string? value, string yes, string no)
    {
        var text = value?.Trim();
        if (string.Equals(text, yes, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (string.Equals(text, no, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return null;
    }

    public async Task<PagedResultDto<AdminAccountDto>> GetPageAsync(
        string? keyword,
        string? status,
        string? role,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);
        bool? isLocked = ParseFilter(status, "locked", "unlocked");
        bool? isAdministrator = ParseFilter(role, "administrator", "member");
        var result = await accountRepository.GetPageAsync(keyword, isLocked, isAdministrator,
            timeProvider.GetUtcNow(), page, pageSize, cancellationToken);
        return new PagedResultDto<AdminAccountDto>(
            result.Items.Select(item => Map(item.User, item.IsAdministrator)).ToList(),
            page,
            pageSize,
            result.TotalItems,
            (int)Math.Ceiling(result.TotalItems / (double)pageSize));
    }

    public async Task<Result<AdminAccountDto>> SetLockedAsync(
        string targetUserId,
        string administratorId,
        SetAccountLockRequest request,
        CancellationToken cancellationToken)
    {
        var isLocked = request.IsLocked;
        var reason = request.Reason?.Trim();
        if (isLocked && (string.IsNullOrWhiteSpace(reason) || reason.Length > 1000))
        {
            return Result<AdminAccountDto>.Fail(ErrorType.Validation, null, "Lý do khóa phải có từ 1 đến 1.000 ký tự.", "reason");
        }
        if (isLocked && request.LockoutEndUtc.HasValue && request.LockoutEndUtc.Value <= timeProvider.GetUtcNow())
        {
            return Result<AdminAccountDto>.Fail(ErrorType.Validation, null, "Thời hạn khóa phải ở tương lai.", "lockoutEndUtc");
        }
        var user = await accountRepository.GetByIdAsync(targetUserId);
        if (user is null)
        {
            return Result<AdminAccountDto>.Fail(ErrorType.NotFound, "Không tìm thấy tài khoản", "Không tìm thấy tài khoản.");
        }
        if (isLocked && targetUserId == administratorId)
        {
            return Result<AdminAccountDto>.Fail(ErrorType.Conflict, "Không thể khóa tài khoản", "Quản trị viên không thể tự khóa tài khoản của mình.");
        }

        var isAdministrator = await accountRepository.IsAdministratorAsync(user);
        if (isLocked && isAdministrator)
        {
            return Result<AdminAccountDto>.Fail(ErrorType.Conflict, "Không thể khóa tài khoản", "Không thể khóa tài khoản quản trị viên từ chức năng này.");
        }

        var wasLocked = user.LockoutEnd.HasValue && user.LockoutEnd.Value > timeProvider.GetUtcNow();
        var result = await accountRepository.SetLockedAsync(user, isLocked, request.LockoutEndUtc, reason,
            new AdminAuditLog
            {
                AdministratorId = administratorId,
                Action = isLocked ? "account-locked" : "account-unlocked",
                TargetType = "Account",
                TargetId = user.Id,
                PreviousValue = $"locked={wasLocked};until={user.LockoutEnd:O}",
                NewValue = $"locked={isLocked};until={(isLocked ? request.LockoutEndUtc : null):O}",
                Reason = isLocked ? reason! : "Mở khóa tài khoản thành viên.",
                CreatedAtUtc = timeProvider.GetUtcNow()
            }, cancellationToken);
        if (!result.Succeeded)
        {
            return Result<AdminAccountDto>.Fail(ErrorType.ServerError, "Không thể cập nhật tài khoản", "Không thể cập nhật trạng thái khóa tài khoản.");
        }
        return Result<AdminAccountDto>.Success(Map(user, isAdministrator));
    }

    private AdminAccountDto Map(ApplicationUser user, bool isAdministrator)
    {
        return new(
            user.Id,
            user.DisplayName,
            user.Email ?? string.Empty,
            user.CreatedAtUtc,
            user.LockoutEnd.HasValue && user.LockoutEnd.Value > timeProvider.GetUtcNow(),
            isAdministrator,
            user.LockoutEnd.HasValue && user.LockoutEnd.Value > timeProvider.GetUtcNow() ? user.LockReason : null,
            !user.LockoutEnd.HasValue || user.LockoutEnd <= timeProvider.GetUtcNow() || user.LockoutEnd == DateTimeOffset.MaxValue
                ? null : user.LockoutEnd);
    }
}
