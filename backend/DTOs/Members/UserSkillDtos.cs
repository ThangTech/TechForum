using System.ComponentModel.DataAnnotations;

namespace TechForum.Api.Dtos;

public sealed record SkillTagDto(Guid TagId, string Name, string Slug);

public sealed class SaveSkillsRequest
{
    // The whole list of skills of the member after the change (an empty list removes all of them).
    [Required(ErrorMessage = "Vui lòng gửi danh sách kỹ năng.")]
    [MaxLength(50, ErrorMessage = "Danh sách kỹ năng quá dài.")]
    public List<Guid>? TagIds { get; init; }
}
