using Microsoft.EntityFrameworkCore;

namespace TechForum.Api.Data.Repositories;

public sealed class UnverifiedAccountRepository : IUnverifiedAccountRepository
{
    private readonly TechForumDbContext dbContext;

    public UnverifiedAccountRepository(TechForumDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    public async Task<IReadOnlyList<string>> GetExpiredAsync(DateTimeOffset createdBefore, int take, CancellationToken cancellationToken)
    {
        return await dbContext.Users
            .Where(user => !user.EmailConfirmed && user.CreatedAtUtc < createdBefore)
            // Tài khoản đã có nội dung thì không xóa tự động, để không mất dữ liệu của người khác (câu trả lời, báo cáo).
            .Where(user => !dbContext.Topics.Any(topic => topic.AuthorId == user.Id) &&
                !dbContext.Answers.Any(answer => answer.AuthorId == user.Id) &&
                !dbContext.ContentReports.Any(report => report.ReporterId == user.Id || report.ResolvedById == user.Id) &&
                !dbContext.UserVotes.Any(vote => vote.UserId == user.Id) &&
                !dbContext.AnswerHelpfulVotes.Any(vote => vote.UserId == user.Id) &&
                !dbContext.MediaAssets.Any(media => media.UploaderId == user.Id) &&
                !dbContext.AdminAuditLogs.Any(log => log.AdministratorId == user.Id))
            .OrderBy(user => user.CreatedAtUtc)
            .Select(user => user.Id)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public async Task DeleteAsync(string userId, CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        await dbContext.RefreshTokens.Where(item => item.UserId == userId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Drafts.Where(item => item.UserId == userId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.TopicStars.Where(item => item.UserId == userId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.TopicBookmarks.Where(item => item.UserId == userId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.UserFollows.Where(item => item.FollowerId == userId || item.FollowingId == userId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.UserSkills.Where(item => item.UserId == userId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Notifications.Where(item => item.UserId == userId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.UserRoles.Where(item => item.UserId == userId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.UserLogins.Where(item => item.UserId == userId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.UserClaims.Where(item => item.UserId == userId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.UserTokens.Where(item => item.UserId == userId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Users.Where(item => item.Id == userId && !item.EmailConfirmed).ExecuteDeleteAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }
}
