using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IAccountClosureRepository
{
    // Thu hồi mọi phiên đăng nhập và đổi security stamp: access token đang dùng ở mọi thiết bị hết hiệu lực ngay.
    Task SignOutEverywhereAsync(ApplicationUser user, DateTimeOffset now, CancellationToken cancellationToken);

    // Xoá dữ liệu cá nhân và khoá tài khoản; bài viết, câu trả lời giữ lại dưới tên "Người dùng đã xóa".
    Task CloseAsync(ApplicationUser user, DateTimeOffset now, CancellationToken cancellationToken);
}
