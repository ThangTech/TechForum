namespace TechForum.Api.Services;

public interface IBannedWordSeeder
{
    // Không thêm gì khi bảng đã có từ: quản trị viên có thể đã cố ý xóa vài từ và chúng không được quay lại.
    Task<int> SeedIfEmptyAsync(IEnumerable<string> lines, CancellationToken cancellationToken);
}
