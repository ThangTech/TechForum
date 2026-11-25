namespace TechForum.Api.Data.Repositories;

public interface IUnverifiedAccountRepository
{
    // Id các tài khoản chưa xác minh email, tạo trước mốc thời gian, chưa đăng gì (bài, câu trả lời, phiếu, báo cáo, tệp).
    Task<IReadOnlyList<string>> GetExpiredAsync(DateTimeOffset createdBefore, int take, CancellationToken cancellationToken);

    // Xóa tài khoản cùng những thứ chỉ của riêng nó (phiên, bản nháp, sao, lưu bài, theo dõi, kỹ năng, thông báo).
    Task DeleteAsync(string userId, CancellationToken cancellationToken);
}
