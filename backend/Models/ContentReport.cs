using TechForum.Api.Enums;

namespace TechForum.Api.Models;

public sealed class ContentReport
{
    public int Id { get; set; }
    public int? TopicId { get; set; }
    public Topic? Topic { get; set; }
    public int? AnswerId { get; set; }
    public Answer? Answer { get; set; }
    public required string ReporterId { get; set; }
    public ApplicationUser Reporter { get; set; } = null!;
    public required string Reason { get; set; }
    public string? Details { get; set; }
    public ReportStatus Status { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public string? ResolvedById { get; set; }
    public ApplicationUser? ResolvedBy { get; set; }
    public DateTimeOffset? ResolvedAtUtc { get; set; }
    public string? ResolutionNote { get; set; }
}
