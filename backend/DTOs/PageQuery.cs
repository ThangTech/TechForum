using System.ComponentModel.DataAnnotations;

namespace TechForum.Api.Dtos;

// Tham số phân trang dùng chung. [ApiController] tự trả 400 khi giá trị sai, nên controller không phải kiểm tra lại.
public class PageQuery
{
    [Range(1, int.MaxValue, ErrorMessage = "Trang phải lớn hơn hoặc bằng 1.")]
    public int Page { get; init; } = 1;

    [Range(1, 50, ErrorMessage = "Số phần tử mỗi trang phải từ 1 đến 50.")]
    public int PageSize { get; init; } = 20;
}
