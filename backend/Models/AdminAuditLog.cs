namespace TechForum.Api.Models;

public sealed class AdminAuditLog
{
    public long Id { get; set; }
    public required string AdministratorId { get; set; }
    public ApplicationUser Administrator { get; set; } = null!;
    public required string Action { get; set; }
    public required string TargetType { get; set; }
    public required string TargetId { get; set; }
    public string? PreviousValue { get; set; }
    public string? NewValue { get; set; }
    public required string Reason { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
}
