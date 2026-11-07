using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public sealed record CreateTopicResult(
    OwnTopicDto? Topic,
    IReadOnlyDictionary<string, string[]> Errors,
    string? ConflictMessage = null)
{
    public bool Succeeded => Topic is not null;

    // The data is valid, but the topic is in a state that does not allow this change.
    public bool IsConflict => ConflictMessage is not null;

    public static CreateTopicResult Success(OwnTopicDto topic) =>
        new(topic, new Dictionary<string, string[]>());

    public static CreateTopicResult ValidationError(string field, string message) =>
        new(null, new Dictionary<string, string[]> { [field] = [message] });

    public static CreateTopicResult Conflict(string message) =>
        new(null, new Dictionary<string, string[]>(), message);
}
