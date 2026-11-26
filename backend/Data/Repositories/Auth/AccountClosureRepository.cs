using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TechForum.Api.Constants;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class AccountClosureRepository : IAccountClosureRepository
{
    public const string DeletedDisplayName = "Người dùng đã xóa";

    private readonly TechForumDbContext dbContext;
    private readonly UserManager<ApplicationUser> userManager;

    public AccountClosureRepository(TechForumDbContext dbContext, UserManager<ApplicationUser> userManager)
    {
        this.dbContext = dbContext;
        this.userManager = userManager;
    }

    public async Task SignOutEverywhereAsync(ApplicationUser user, DateTimeOffset now, CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        await dbContext.RefreshTokens
            .Where(token => token.UserId == user.Id && token.RevokedAtUtc == null)
            .ExecuteUpdateAsync(set => set.SetProperty(token => token.RevokedAtUtc, now), cancellationToken);
        await userManager.UpdateSecurityStampAsync(user);
        await transaction.CommitAsync(cancellationToken);
    }

    public async Task CloseAsync(ApplicationUser user, DateTimeOffset now, CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var id = user.Id;
        // Dữ liệu riêng tư hoặc chỉ có ý nghĩa với chủ tài khoản: xoá hẳn.
        await dbContext.RefreshTokens.Where(item => item.UserId == id).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Drafts.Where(item => item.UserId == id).ExecuteDeleteAsync(cancellationToken);
        await dbContext.TopicBookmarks.Where(item => item.UserId == id).ExecuteDeleteAsync(cancellationToken);
        await dbContext.UserFollows.Where(item => item.FollowerId == id || item.FollowingId == id).ExecuteDeleteAsync(cancellationToken);
        await dbContext.UserSkills.Where(item => item.UserId == id).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Notifications.Where(item => item.UserId == id).ExecuteDeleteAsync(cancellationToken);
        await dbContext.UserLogins.Where(item => item.UserId == id).ExecuteDeleteAsync(cancellationToken);
        await dbContext.UserClaims.Where(item => item.UserId == id).ExecuteDeleteAsync(cancellationToken);
        await dbContext.UserTokens.Where(item => item.UserId == id).ExecuteDeleteAsync(cancellationToken);

        // Tài khoản còn lại chỉ là tên "Người dùng đã xóa" để bài cũ không mất tác giả; không đăng nhập lại được.
        var placeholder = $"deleted-{id}@deleted.invalid";
        user.DisplayName = DeletedDisplayName;
        user.Email = placeholder;
        user.NormalizedEmail = placeholder.ToUpperInvariant();
        user.UserName = placeholder;
        user.NormalizedUserName = placeholder.ToUpperInvariant();
        user.EmailConfirmed = true;
        user.PasswordHash = null;
        user.PhoneNumber = null;
        user.Bio = null;
        user.AvatarUrl = null;
        user.LockoutEnabled = true;
        user.LockoutEnd = DateTimeOffset.MaxValue;
        user.LockReason = $"Tài khoản đã được xóa theo yêu cầu của chủ tài khoản lúc {now:yyyy-MM-dd HH:mm} UTC.";
        user.SecurityStamp = Guid.NewGuid().ToString("N");
        await userManager.UpdateAsync(user);
        if (await userManager.IsInRoleAsync(user, RoleNames.Administrator))
        {
            await userManager.RemoveFromRoleAsync(user, RoleNames.Administrator);
        }
        await transaction.CommitAsync(cancellationToken);
    }
}
