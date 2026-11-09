using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TechForum.Api.Enums;
using TechForum.Api.Models;
using TechForum.Api.Services;

namespace TechForum.Api.Data.Repositories;

public sealed class VoteRepository(TechForumDbContext dbContext) : IVoteRepository
{
    // Two requests of the same member can arrive at the same moment. In a serializable transaction the second one
    // waits or is chosen as the victim of a deadlock (1205) or meets the primary key (2601, 2627); it then reads the
    // vote again and finds what the first one wrote, so a few tries are enough.
    private const int MaxAttempts = 4;

    public async Task<VoteOutcome> ApplyAsync(VoteCommand command, CancellationToken cancellationToken)
    {
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                return await ApplyOnceAsync(command, cancellationToken);
            }
            catch (Exception exception) when (attempt < MaxAttempts && IsRaceFailure(exception))
            {
                dbContext.ChangeTracker.Clear();
            }
        }
    }

    public async Task<int> GetMyVoteAsync(
        string userId,
        VoteTargetType targetType,
        int targetId,
        CancellationToken cancellationToken) =>
        await dbContext.UserVotes.AsNoTracking()
            .Where(vote => vote.UserId == userId && vote.TargetType == targetType && vote.TargetId == targetId)
            .Select(vote => vote.Value)
            .SingleOrDefaultAsync(cancellationToken);

    private async Task<VoteOutcome> ApplyOnceAsync(VoteCommand command, CancellationToken cancellationToken)
    {
        var strategy = dbContext.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            dbContext.ChangeTracker.Clear();
            await using var transaction = await dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

            var existing = await dbContext.UserVotes.SingleOrDefaultAsync(
                vote => vote.UserId == command.VoterId && vote.TargetType == command.TargetType && vote.TargetId == command.TargetId,
                cancellationToken);
            var previous = existing?.Value ?? 0;
            var scoreChange = command.NewValue - previous;

            if (scoreChange != 0)
            {
                // 1. the vote
                if (command.NewValue == 0)
                {
                    dbContext.UserVotes.Remove(existing!);
                }
                else if (existing is null)
                {
                    dbContext.UserVotes.Add(new UserVote
                    {
                        UserId = command.VoterId,
                        TargetType = command.TargetType,
                        TargetId = command.TargetId,
                        Value = command.NewValue,
                        CreatedAtUtc = command.NowUtc
                    });
                }
                else
                {
                    existing.Value = command.NewValue;
                    existing.UpdatedAtUtc = command.NowUtc;
                }
                await dbContext.SaveChangesAsync(cancellationToken);

                // 2. the score of the post or answer (added in the database, so two voters never overwrite each other)
                var changed = command.TargetType == VoteTargetType.Topic
                    ? await dbContext.Topics.Where(topic => topic.Id == command.TargetId)
                        .ExecuteUpdateAsync(set => set.SetProperty(topic => topic.Score, topic => topic.Score + scoreChange), cancellationToken)
                    : await dbContext.Answers.Where(answer => answer.Id == command.TargetId)
                        .ExecuteUpdateAsync(set => set.SetProperty(answer => answer.Score, answer => answer.Score + scoreChange), cancellationToken);
                if (changed != 1) throw new InvalidOperationException("Không tìm thấy nội dung được bình chọn.");

                // 3. the reputation of its author: what the new vote gives minus what the old vote gave
                var points = ReputationRules.ForVote(command.TargetType, command.NewValue) - ReputationRules.ForVote(command.TargetType, previous);
                if (points != 0)
                {
                    var users = await dbContext.Users.Where(user => user.Id == command.AuthorId)
                        .ExecuteUpdateAsync(set => set.SetProperty(user => user.Reputation, user => user.Reputation + points), cancellationToken);
                    if (users != 1) throw new InvalidOperationException("Không tìm thấy tác giả của nội dung được bình chọn.");
                }
            }

            var score = command.TargetType == VoteTargetType.Topic
                ? await dbContext.Topics.Where(topic => topic.Id == command.TargetId).Select(topic => topic.Score).SingleAsync(cancellationToken)
                : await dbContext.Answers.Where(answer => answer.Id == command.TargetId).Select(answer => answer.Score).SingleAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return new VoteOutcome(previous, command.NewValue, score);
        });
    }

    private static bool IsRaceFailure(Exception exception)
    {
        var sql = exception as SqlException ?? (exception as DbUpdateException)?.InnerException as SqlException;
        return sql is { Number: 1205 or 2601 or 2627 };
    }
}
