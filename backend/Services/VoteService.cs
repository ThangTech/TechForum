using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;

namespace TechForum.Api.Services;

public sealed class VoteService(
    ITopicRepository topicRepository,
    IAnswerRepository answerRepository,
    IVoteRepository voteRepository,
    IAccountRepository accountRepository,
    IVoteRateLimiter rateLimiter,
    IOptions<VoteLimitOptions> limitOptions,
    TimeProvider timeProvider) : IVoteService
{
    public async Task<VoteDto?> GetTopicVoteAsync(int topicId, string? viewerId, CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetPublicByIdAsync(topicId, cancellationToken);
        if (topic is null) return null;

        var myVote = string.IsNullOrWhiteSpace(viewerId)
            ? 0
            : await voteRepository.GetMyVoteAsync(viewerId, VoteTargetType.Topic, topicId, cancellationToken);
        return new VoteDto(ReputationRules.ForDisplay(topic.Score), myVote);
    }

    public async Task<VoteResult> SetTopicVoteAsync(int topicId, string userId, int value, CancellationToken cancellationToken)
    {
        var refused = CheckValueAndSpeed(userId, value);
        if (refused is not null) return refused;

        var topic = await topicRepository.GetPublicByIdAsync(topicId, cancellationToken);
        if (topic is null) return VoteResult.Failed(VoteFailure.NotFound);
        if (topic.AuthorId == userId) return VoteResult.Failed(VoteFailure.OwnContent);
        var tooNew = await CheckAccountAgeAsync(userId, value, cancellationToken);
        if (tooNew is not null) return tooNew;

        return await ApplyAsync(userId, VoteTargetType.Topic, topicId, topic.AuthorId, value, cancellationToken);
    }

    public async Task<VoteResult> SetAnswerVoteAsync(
        int topicId,
        int answerId,
        string userId,
        int value,
        CancellationToken cancellationToken)
    {
        var refused = CheckValueAndSpeed(userId, value);
        if (refused is not null) return refused;

        // The answer must be one that everyone can read, in a post that everyone can read.
        var topic = await topicRepository.GetPublicByIdAsync(topicId, cancellationToken);
        if (topic is null) return VoteResult.Failed(VoteFailure.NotFound);
        var answer = await answerRepository.GetVisibleByIdAsync(topicId, answerId, cancellationToken);
        if (answer is null) return VoteResult.Failed(VoteFailure.NotFound);
        if (answer.AuthorId == userId) return VoteResult.Failed(VoteFailure.OwnContent);
        var tooNew = await CheckAccountAgeAsync(userId, value, cancellationToken);
        if (tooNew is not null) return tooNew;

        return await ApplyAsync(userId, VoteTargetType.Answer, answerId, answer.AuthorId, value, cancellationToken);
    }

    // The checks that do not need the database: the value, and how fast the member votes. A request that is refused for
    // its value does not use a place of the limit.
    private VoteResult? CheckValueAndSpeed(string userId, int value)
    {
        if (value is < -1 or > 1) return VoteResult.Failed(VoteFailure.InvalidValue);
        if (!rateLimiter.TryAcquire(userId, out var retryAfter))
        {
            return VoteResult.Limited((int)Math.Ceiling(Math.Max(1, retryAfter.TotalSeconds)));
        }
        return null;
    }

    // A new account cannot give a vote, and a downvote needs more: an account of at least DownvoteMinAccountAgeDays or a member
    // with at least DownvoteMinReputation points. Taking a vote back (value 0) is always allowed.
    private async Task<VoteResult?> CheckAccountAgeAsync(string userId, int value, CancellationToken cancellationToken)
    {
        if (value == 0) return null;

        var limits = limitOptions.Value;
        var user = await accountRepository.FindByIdAsync(userId);
        if (user is null) return VoteResult.Failed(VoteFailure.NotFound);

        var age = timeProvider.GetUtcNow() - user.CreatedAtUtc;
        var minimumAge = TimeSpan.FromDays(limits.MinAccountAgeDays);
        if (age < minimumAge) return VoteResult.TooNew((int)Math.Ceiling((minimumAge - age).TotalDays));

        if (value < 0)
        {
            var downvoteAge = TimeSpan.FromDays(limits.DownvoteMinAccountAgeDays);
            // The real reputation counts (the one shown is never below 0, the real one can be).
            if (age < downvoteAge && user.Reputation < limits.DownvoteMinReputation)
            {
                return VoteResult.DownvoteLocked(new DownvoteRequirement(
                    limits.DownvoteMinAccountAgeDays,
                    limits.DownvoteMinReputation,
                    (int)Math.Ceiling((downvoteAge - age).TotalDays),
                    limits.DownvoteMinReputation - Math.Max(0, user.Reputation)));
            }
        }
        return null;
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
        return VoteResult.Success(new VoteDto(ReputationRules.ForDisplay(outcome.Score), outcome.NewValue));
    }
}
