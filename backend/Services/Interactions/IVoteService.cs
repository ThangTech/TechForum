using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IVoteService
{
    // The score of a post and the vote of the member who asks (a guest has none). Null when the post cannot be seen.
    Task<VoteDto?> GetTopicVoteAsync(Guid topicId, string? viewerId, CancellationToken cancellationToken);

    // value: 1 = upvote, -1 = downvote, 0 = take the vote back. The same value sent again changes nothing.
    Task<Result<VoteDto>> SetTopicVoteAsync(Guid topicId, string userId, int value, CancellationToken cancellationToken);

    Task<Result<VoteDto>> SetAnswerVoteAsync(Guid topicId, Guid answerId, string userId, int value, CancellationToken cancellationToken);
}
