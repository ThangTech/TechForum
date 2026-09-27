namespace TechForum.Api.Models;

public sealed class Category
{
    public int Id { get; set; }

    public required string Name { get; set; }

    public required string Slug { get; set; }

    public string? Description { get; set; }

    public int DisplayOrder { get; set; }
}
