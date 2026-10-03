using TechForum.Api.Enums;

namespace TechForum.Api.Models;

public sealed class Topic
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public required string Slug { get; set; }
    public required string Summary { get; set; }
    public required string BodyHtml { get; set; }
    public TopicType Type { get; set; }
    public TopicStatus Status { get; set; }
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public required string AuthorId { get; set; }
    public ApplicationUser Author { get; set; } = null!;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset? UpdatedAtUtc { get; set; }
    public DateTimeOffset? PublishedAtUtc { get; set; }
    public bool IsDeleted { get; set; }
    public bool IsHiddenByModerator { get; set; }
    public bool IsDiscussionLocked { get; set; }
    public bool IsPinned { get; set; }
    public int ViewCount { get; set; }
    public int ShareCount { get; set; }
    public int? AcceptedAnswerId { get; set; }
    public Answer? AcceptedAnswer { get; set; }
    public ICollection<TopicTag> TopicTags { get; set; } = [];
    public ICollection<MediaAsset> MediaAssets { get; set; } = [];
    public ICollection<Answer> Answers { get; set; } = [];
    public ICollection<TopicStar> Stars { get; set; } = [];
    public ICollection<TopicBookmark> Bookmarks { get; set; } = [];
    public ICollection<TopicView> Views { get; set; } = [];
}
