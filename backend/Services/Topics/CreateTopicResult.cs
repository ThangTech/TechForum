using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public sealed record CreateTopicResult(
    OwnTopicDto? Topic,
    IReadOnlyDictionary<string, string[]> Errors,
    string? ConflictMessage = null,
    int RetryAfterSeconds = 0)
{
    public bool Succeeded => Topic is not null;

    // The data is valid, but the topic is in a state that does not allow this change.
    public bool IsConflict => ConflictMessage is not null;

    // The member published a topic a moment ago and must wait RetryAfterSeconds.
    public bool IsRateLimited => RetryAfterSeconds > 0;

    public static CreateTopicResult Success(OwnTopicDto topic) =>
        new(topic, new Dictionary<string, string[]>());

    public static CreateTopicResult ValidationError(string field, string message) =>
        new(null, new Dictionary<string, string[]> { [field] = [message] });

    public static CreateTopicResult Conflict(string message) =>
        new(null, new Dictionary<string, string[]>(), message);

    public static CreateTopicResult Limited(int retryAfterSeconds) =>
        new(null, new Dictionary<string, string[]>(), RetryAfterSeconds: retryAfterSeconds);
}
