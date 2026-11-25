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
        Assert.Equal(ErrorType.Validation, result.Error);
        Assert.Equal("reason", result.Field);
        Assert.Equal(0, repository.SaveCount);
    }

    [Fact]
    public async Task Lock_RejectsPastExpiry()
    {
        var repository = new FakeRepository();
        var result = await Service(repository).SetLockedAsync("member", "admin", new(true, "Vi phạm", Now), default);
        Assert.Equal(ErrorType.Validation, result.Error);
        Assert.Equal("lockoutEndUtc", result.Field);
        Assert.Equal(0, repository.SaveCount);
    }

    [Theory]
    [InlineData("member", "member", false, ErrorType.Conflict)]
    [InlineData("member", "admin", true, ErrorType.Conflict)]
    public async Task Lock_ProtectsOwnAndAdministratorAccount(string target, string actor, bool admin,
        ErrorType expected)
    {
        var repository = new FakeRepository { IsAdministrator = admin };
        var result = await Service(repository).SetLockedAsync(target, actor, new(true, "Vi phạm"), default);
        Assert.Equal(expected, result.Error);
        Assert.Equal(0, repository.SaveCount);
    }

    [Fact]
    public async Task Lock_SavesTrimmedReasonAndExpiryWithAudit()
    {
        var repository = new FakeRepository();
        var expiry = Now.AddDays(7);
        var result = await Service(repository).SetLockedAsync("member", "admin", new(true, "  Spam lặp lại  ", expiry), default);
        Assert.True(result.Succeeded);
        Assert.NotNull(result.Value);
        Assert.True(result.Value.IsLocked);
        Assert.Equal(expiry, result.Value.LockoutEndUtc);
        Assert.Equal("Spam lặp lại", result.Value.LockReason);
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
        Assert.NotNull(result.Value);
        Assert.False(result.Value.IsLocked);
        Assert.Null(result.Value.LockReason);
        Assert.Null(result.Value.LockoutEndUtc);
        Assert.Equal("account-unlocked", repository.Audit?.Action);
    }

    [Fact]
    public async Task Role_GrantsAdministratorWithAuditAndNotification()
    {
        var repository = new FakeRepository();
        repository.User.EmailConfirmed = true;

        var result = await Service(repository).SetRoleAsync("member", "admin", new(true, "Thêm người kiểm duyệt"), default);

        Assert.True(result.Succeeded);
        Assert.True(repository.IsAdministrator);
        Assert.Equal("account-role-granted", repository.Audit?.Action);
        Assert.Equal("member", repository.Notification?.UserId);
    }

    [Fact]
    public async Task Role_CannotChangeOwnRoleOrRemoveTheLastAdministrator()
    {
        var self = await Service(new FakeRepository()).SetRoleAsync("admin", "admin", new(false, "Thử"), default);
        var last = await Service(new FakeRepository { IsAdministrator = true, AdministratorCount = 1 })
            .SetRoleAsync("member", "admin", new(false, "Thử"), default);

        Assert.Equal(ErrorType.Conflict, self.Error);
        Assert.Equal(ErrorType.Conflict, last.Error);
    }

    [Theory]
    [InlineData(false, false)]
    [InlineData(true, true)]
    public async Task Role_IsOnlyGrantedToAVerifiedUnlockedAccount(bool verified, bool expected)
    {
        var repository = new FakeRepository();
        repository.User.EmailConfirmed = verified;

        var result = await Service(repository).SetRoleAsync("member", "admin", new(true, "Lý do"), default);

        Assert.Equal(expected, result.Succeeded);
    }

    [Fact]
    public async Task Role_RequiresAReason()
    {
        var result = await Service(new FakeRepository()).SetRoleAsync("member", "admin", new(true, " "), default);

        Assert.Equal("reason", result.Field);
    }

    private static AdminAccountService Service(FakeRepository repository) => new(repository, new Clock());
    private sealed class Clock : TimeProvider { public override DateTimeOffset GetUtcNow() => Now; }
    private sealed class FakeRepository : IAdminAccountRepository
    {
        public ApplicationUser User { get; } = new() { Id = "member", DisplayName = "Thành viên" };
        public bool IsAdministrator { get; set; }
        public int AdministratorCount { get; init; } = 2;
        public int SaveCount { get; private set; }
        public AdminAuditLog? Audit { get; private set; }
        public Notification? Notification { get; private set; }
        public Task<ApplicationUser?> GetByIdAsync(string id) => Task.FromResult<ApplicationUser?>(User);
        public Task<bool> IsAdministratorAsync(ApplicationUser user) => Task.FromResult(IsAdministrator);
        public Task<AdminAccountPage> GetPageAsync(AdminAccountFilter filter,
            DateTimeOffset now, int page, int pageSize, CancellationToken cancellationToken) =>
            Task.FromResult(new AdminAccountPage([new(User, IsAdministrator, 0, 0, 0)], 1));
        public Task<AdminAccountData?> GetDataAsync(string id, CancellationToken cancellationToken) =>
            Task.FromResult<AdminAccountData?>(new(User, IsAdministrator, 0, 0, 0));
        public Task<int> CountAdministratorsAsync(CancellationToken cancellationToken) => Task.FromResult(AdministratorCount);
        public Task<IdentityResult> SetAdministratorAsync(ApplicationUser user, bool isAdministrator, AdminAuditLog auditLog,
            Notification notification, CancellationToken cancellationToken)
        {
            SaveCount++;
            IsAdministrator = isAdministrator;
            Audit = auditLog;
            Notification = notification;
            return Task.FromResult(IdentityResult.Success);
        }
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
