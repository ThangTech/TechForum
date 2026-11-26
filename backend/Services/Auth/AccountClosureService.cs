using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos.Auth;

namespace TechForum.Api.Services;

// Đăng xuất mọi thiết bị và tự xoá tài khoản (quyền được xoá dữ liệu cá nhân trong Chính sách bảo mật).
public sealed class AccountClosureService : IAccountClosureService
{
    public const string ConfirmationWord = "XÓA";

    private readonly IAccountRepository accountRepository;
    private readonly IAccountClosureRepository closureRepository;
    private readonly IAvatarService avatarService;
    private readonly TimeProvider timeProvider;

    public AccountClosureService(
        IAccountRepository accountRepository,
        IAccountClosureRepository closureRepository,
        IAvatarService avatarService,
        TimeProvider timeProvider)
    {
        this.accountRepository = accountRepository;
        this.closureRepository = closureRepository;
        this.avatarService = avatarService;
        this.timeProvider = timeProvider;
    }

    public async Task<Result> SignOutEverywhereAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await accountRepository.FindByIdAsync(userId);
        if (user is null)
        {
            return Result.Fail(ErrorType.Unauthorized, "Bạn cần đăng nhập", "Phiên đăng nhập không còn hợp lệ.");
        }
        await closureRepository.SignOutEverywhereAsync(user, timeProvider.GetUtcNow(), cancellationToken);
        return Result.Success();
    }

    public async Task<Result> CloseAsync(string userId, CloseAccountRequest request, CancellationToken cancellationToken)
    {
        if (!string.Equals(request.Confirmation?.Trim(), ConfirmationWord, StringComparison.Ordinal))
        {
            return Result.Fail(ErrorType.Validation, null, $"Hãy gõ đúng chữ {ConfirmationWord} để xác nhận.", "confirmation");
        }
        var user = await accountRepository.FindByIdAsync(userId);
        if (user is null)
        {
            return Result.Fail(ErrorType.Unauthorized, "Bạn cần đăng nhập", "Phiên đăng nhập không còn hợp lệ.");
        }
        var roles = await accountRepository.GetRolesAsync(user);
        if (roles.Contains(TechForum.Api.Constants.RoleNames.Administrator))
        {
            return Result.Fail(ErrorType.Conflict, "Không thể xóa tài khoản",
                "Tài khoản quản trị viên cần được một quản trị viên khác thu quyền trước khi xóa.");
        }
        if (await accountRepository.HasPasswordAsync(user))
        {
            var check = await accountRepository.CheckPasswordAsync(user, request.Password ?? string.Empty);
            if (!check.Succeeded)
            {
                return Result.Fail(ErrorType.Validation, null, "Mật khẩu chưa đúng.", "password");
            }
        }

        // Ảnh đại diện nằm trên Cloudinary: xoá trước, lỗi thì vẫn tiếp tục đóng tài khoản.
        if (user.AvatarUrl is not null)
        {
            await avatarService.DeleteAsync(user.Id, cancellationToken);
        }
        await closureRepository.CloseAsync(user, timeProvider.GetUtcNow(), cancellationToken);
        return Result.Success();
    }
}
