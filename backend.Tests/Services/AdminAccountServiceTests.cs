using Microsoft.AspNetCore.Identity;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Models;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class AdminAccountServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 21, 0, 0, 0, TimeSpan.Zero);

    [Theory]
    [InlineData(null)]
    [InlineData(" ")]
    public async Task Lock_RequiresReasonAndDoesNotPersist(string? reason)
    {
        var repository = new FakeRepository();
        var result = await Service(repository).SetLockedAsync("member", "admin", new(true, reason), default);
        Assert.Equal(AdminAccountWriteFailure.Validation, result.Failure);
        Assert.Equal("reason", result.Field);
        Assert.Equal(0, repository.SaveCount);
    }

    [Fact]
    public async Task Lock_RejectsPastExpiry()
    {
        var repository = new FakeRepository();
        var result = await Service(repository).SetLockedAsync("member", "admin", new(true, "Vi phạm", Now), default);
        Assert.Equal(AdminAccountWriteFailure.Validation, result.Failure);
        Assert.Equal("lockoutEndUtc", result.Field);
        Assert.Equal(0, repository.SaveCount);
    }

    [Theory]
    [InlineData("member", "member", false, AdminAccountWriteFailure.SelfLock)]
    [InlineData("member", "admin", true, AdminAccountWriteFailure.AdministratorProtected)]
    public async Task Lock_ProtectsOwnAndAdministratorAccount(string target, string actor, bool admin,
        AdminAccountWriteFailure expected)
    {
        var repository = new FakeRepository { IsAdministrator = admin };
        var result = await Service(repository).SetLockedAsync(target, actor, new(true, "Vi phạm"), default);
        Assert.Equal(expected, result.Failure);
        Assert.Equal(0, repository.SaveCount);
    }

    [Fact]
    public async Task Lock_SavesTrimmedReasonAndExpiryWithAudit()
    {
        var repository = new FakeRepository();
        var expiry = Now.AddDays(7);
        var result = await Service(repository).SetLockedAsync("member", "admin", new(true, "  Spam lặp lại  ", expiry), default);
        Assert.Equal(AdminAccountWriteFailure.None, result.Failure);
        Assert.NotNull(result.Account);
        Assert.True(result.Account.IsLocked);
        Assert.Equal(expiry, result.Account.LockoutEndUtc);
        Assert.Equal("Spam lặp lại", result.Account.LockReason);
        Assert.NotNull(repository.Audit);
        Assert.Equal("Spam lặp lại", repository.Audit.Reason);
        Assert.Equal("admin", repository.Audit.AdministratorId);
        Assert.Equal(1, repository.SaveCount);
    }

    [Fact]
    public async Task Unlock_ClearsReasonAndExpiry()
    {
        var repository = new FakeRepository();
        repository.User.LockReason = "Lý do cũ";
        repository.User.LockoutEnd = DateTimeOffset.MaxValue;
        var result = await Service(repository).SetLockedAsync("member", "admin", new(false), default);
        Assert.NotNull(result.Account);
        Assert.False(result.Account.IsLocked);
        Assert.Null(result.Account.LockReason);
        Assert.Null(result.Account.LockoutEndUtc);
        Assert.Equal("account-unlocked", repository.Audit?.Action);
    }

    private static AdminAccountService Service(FakeRepository repository) => new(repository, new Clock());
    private sealed class Clock : TimeProvider { public override DateTimeOffset GetUtcNow() => Now; }
    private sealed class FakeRepository : IAdminAccountRepository
    {
        public ApplicationUser User { get; } = new() { Id = "member", DisplayName = "Thành viên" };
        public bool IsAdministrator { get; init; }
        public int SaveCount { get; private set; }
        public AdminAuditLog? Audit { get; private set; }
        public Task<ApplicationUser?> GetByIdAsync(string id) => Task.FromResult<ApplicationUser?>(User);
        public Task<bool> IsAdministratorAsync(ApplicationUser user) => Task.FromResult(IsAdministrator);
        public Task<AdminAccountPage> GetPageAsync(string? keyword, bool? isLocked, bool? isAdministrator,
            DateTimeOffset now, int page, int pageSize, CancellationToken cancellationToken) =>
            Task.FromResult(new AdminAccountPage([new(User, IsAdministrator)], 1));
        public Task<IdentityResult> SetLockedAsync(ApplicationUser user, bool isLocked, DateTimeOffset? lockoutEndUtc,
            string? reason, AdminAuditLog auditLog, CancellationToken cancellationToken)
        {
            SaveCount++;
            Audit = auditLog;
            user.LockReason = isLocked ? reason : null;
            user.LockoutEnd = isLocked ? lockoutEndUtc ?? DateTimeOffset.MaxValue : null;
            return Task.FromResult(IdentityResult.Success);
        }
    }
}
