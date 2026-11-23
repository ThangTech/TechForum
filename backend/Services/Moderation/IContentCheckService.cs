using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

// Cho thành viên biết, ngay khi đang viết, từ nào sẽ bị thay bằng "***". Không lưu gì.
public interface IContentCheckService
{
    Task<ContentCheckResultDto> CheckAsync(CheckContentRequest request, CancellationToken cancellationToken);
}
