using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public sealed record CreateTopicResult(
    OwnTopicDto? Topic,
    IReadOnlyDictionary<string, string[]> Errors)
{
    public bool Succeeded => Topic is not null;

    public static CreateTopicResult Success(OwnTopicDto topic) =>
        new(topic, new Dictionary<string, string[]>());

    public static CreateTopicResult ValidationError(string field, string message) =>
        new(null, new Dictionary<string, string[]> { [field] = [message] });
}
