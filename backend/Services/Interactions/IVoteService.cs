using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IVoteService
{
    Task<VoteDto?> GetTopicVoteAsync(Guid topicId, string? viewerId, CancellationToken cancellationToken);

    // Gửi lại cùng giá trị thì không có gì thay đổi.
    Task<Result<VoteDto>> SetTopicVoteAsync(Guid topicId, string userId, int value, CancellationToken cancellationToken);

    Task<Result<VoteDto>> SetAnswerVoteAsync(Guid topicId, Guid answerId, string userId, int value, CancellationToken cancellationToken);
}
