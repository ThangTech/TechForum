using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;

namespace TechForum.Api.Services;

public sealed class VoteService(
    ITopicRepository topicRepository,
    IAnswerRepository answerRepository,
    IVoteRepository voteRepository,
    TimeProvider timeProvider) : IVoteService
{
    public async Task<VoteDto?> GetTopicVoteAsync(int topicId, string? viewerId, CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetPublicByIdAsync(topicId, cancellationToken);
        if (topic is null) return null;

        var myVote = string.IsNullOrWhiteSpace(viewerId)
            ? 0
            : await voteRepository.GetMyVoteAsync(viewerId, VoteTargetType.Topic, topicId, cancellationToken);
        return new VoteDto(topic.Score, myVote);
    }

    public async Task<VoteResult> SetTopicVoteAsync(int topicId, string userId, int value, CancellationToken cancellationToken)
    {
        if (value is < -1 or > 1) return VoteResult.Failed(VoteFailure.InvalidValue);

        var topic = await topicRepository.GetPublicByIdAsync(topicId, cancellationToken);
        if (topic is null) return VoteResult.Failed(VoteFailure.NotFound);
        if (topic.AuthorId == userId) return VoteResult.Failed(VoteFailure.OwnContent);

        return await ApplyAsync(userId, VoteTargetType.Topic, topicId, topic.AuthorId, value, cancellationToken);
    }

    public async Task<VoteResult> SetAnswerVoteAsync(
        int topicId,
        int answerId,
        string userId,
        int value,
        CancellationToken cancellationToken)
    {
        if (value is < -1 or > 1) return VoteResult.Failed(VoteFailure.InvalidValue);

        // The answer must be one that everyone can read, in a post that everyone can read.
        var topic = await topicRepository.GetPublicByIdAsync(topicId, cancellationToken);
        if (topic is null) return VoteResult.Failed(VoteFailure.NotFound);
        var answer = await answerRepository.GetVisibleByIdAsync(topicId, answerId, cancellationToken);
        if (answer is null) return VoteResult.Failed(VoteFailure.NotFound);
        if (answer.AuthorId == userId) return VoteResult.Failed(VoteFailure.OwnContent);

        return await ApplyAsync(userId, VoteTargetType.Answer, answerId, answer.AuthorId, value, cancellationToken);
    }

    private async Task<VoteResult> ApplyAsync(
        string userId,
        VoteTargetType targetType,
        int targetId,
        string authorId,
        int value,
        CancellationToken cancellationToken)
    {
        var outcome = await voteRepository.ApplyAsync(
            new VoteCommand(userId, targetType, targetId, authorId, value, timeProvider.GetUtcNow()),
            cancellationToken);
        return VoteResult.Success(new VoteDto(outcome.Score, outcome.NewValue));
    }
}
