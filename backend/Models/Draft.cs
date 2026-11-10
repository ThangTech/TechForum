using TechForum.Api.Enums;

namespace TechForum.Api.Models;

// What a member has typed in the "write" form and not saved as a topic yet. It is saved by itself while
// the member writes, so a lost connection or a reload does not lose the text.
// A member has one draft for a new topic (TopicId is null) and one draft for each topic they are editing.
// The fields are not checked as strictly as a topic, because a draft is allowed to be unfinished.
public sealed class Draft
{
    public Guid Id { get; set; }
    public required string UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
    public Guid? TopicId { get; set; }
    public Topic? Topic { get; set; }
    public required string Title { get; set; }
    public required string Summary { get; set; }
    public required string BodyHtml { get; set; }
    public TopicType Type { get; set; }
    public Guid? CategoryId { get; set; }
    public List<Guid> TagIds { get; set; } = [];
    // The pictures and videos of the body. The cleanup of unused uploads keeps them while the draft exists.
    public List<Guid> MediaIds { get; set; } = [];
    public DateTimeOffset UpdatedAtUtc { get; set; }
}
