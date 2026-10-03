namespace TechForum.Api.Models;

public sealed class Tag
{
    public int Id { get; set; }

    public required string Name { get; set; }

    public required string Slug { get; set; }

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;
}
