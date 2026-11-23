using System.ComponentModel.DataAnnotations;

namespace TechForum.Api.Dtos;

public sealed record SkillTagDto(Guid TagId, string Name, string Slug);

public sealed class SaveSkillsRequest
{
    // Danh sách rỗng là bỏ hết kỹ năng.
    [Required(ErrorMessage = "Vui lòng gửi danh sách kỹ năng.")]
    [MaxLength(50, ErrorMessage = "Danh sách kỹ năng quá dài.")]
    public List<Guid>? TagIds { get; init; }
}
