using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public enum AdminTopicWriteFailure { None, Validation, NotFound, Conflict }

public sealed record AdminTopicWriteResult(
    AdminTopicDto? Topic,
    AdminTopicWriteFailure Failure,
    string? Field,
    string? Message)
{
    public static AdminTopicWriteResult Success(AdminTopicDto topic) =>
        new(topic, AdminTopicWriteFailure.None, null, null);
    public static AdminTopicWriteResult Failed(
        AdminTopicWriteFailure failure,
        string message,
        string? field = null) => new(null, failure, field, message);
}
