using TechForum.Api.Dtos.Auth;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public interface IEmailVerificationService
{
    // Gửi email có link xác minh. Lỗi gửi chỉ ghi log: tài khoản vẫn được tạo và người dùng gửi lại được.
    Task SendAsync(ApplicationUser user, CancellationToken cancellationToken);

    Task<Result> ResendAsync(string userId, CancellationToken cancellationToken);

    Task<Result> ConfirmAsync(ConfirmEmailRequest request, CancellationToken cancellationToken);
}
