using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;
using TechForum.Api.Services;
using TechForum.Api.Tests.Fakes;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class ContentReportServiceTests
{
    [Theory]
    [InlineData(TopicStatus.Draft, false, false)]
    [InlineData(TopicStatus.Published, true, false)]
    [InlineData(TopicStatus.Published, false, true)]
    public async Task Mine_HidesTitleAndLinkForNonPublicContent(TopicStatus status, bool hidden, bool deleted)
    {
        var report = CreateReport();
        Assert.NotNull(report.Topic);
        report.Topic.Status = status;
        report.Topic.IsHiddenByModerator = hidden;
        report.Topic.IsDeleted = deleted;
        var repository = new FakeReports { Report = report };

        var result = await Service(repository).GetMineAsync("reporter", null, 1, 10, default);

        Assert.NotNull(result);
        var item = Assert.Single(result.Items);
        Assert.Equal("reporter", repository.RequestedReporterId);
        Assert.Null(item.TargetTitle);
        Assert.Null(item.TopicId);
        Assert.Equal("spam", item.Reason);
        var serialized = System.Text.Json.JsonSerializer.Serialize(item);
        Assert.DoesNotContain("secret@", serialized);
        Assert.DoesNotContain("Nội dung bí mật", serialized);
    }

    [Fact]
    public async Task Mine_HidesAnswerWhenTopicIsPublicButAnswerIsHidden()
    {
        var report = CreateReport();
        report.Answer = new Answer
        {
            Id = TestIds.Id(9), Topic = report.Topic!, TopicId = TestIds.Id(5), AuthorId = "author", BodyHtml = "Bí mật", IsHiddenByModerator = true
        };
        report.TopicId = null;
        report.Topic = null;
        report.AnswerId = TestIds.Id(9);
        var result = await Service(new FakeReports { Report = report }).GetMineAsync("reporter", null, 1, 10, default);
        Assert.NotNull(result);
        Assert.Null(Assert.Single(result.Items).TargetTitle);
    }

    [Theory]
    [InlineData("hidden")]
    [InlineData("deleted")]
    [InlineData("different-topic")]
    [InlineData("nested")]
    [InlineData("missing")]
    public async Task Mine_HidesChildLinkForInvalidParentButKeepsReportOutcome(string parentState)
    {
        var report = CreateAnswerReport();
        var answer = report.Answer!;
        var parent = answer.ParentAnswer!;
        if (parentState == "hidden") parent.IsHiddenByModerator = true;
        if (parentState == "deleted") parent.IsDeleted = true;
        if (parentState == "different-topic") parent.TopicId = TestIds.Id(99);
        if (parentState == "nested") parent.ParentAnswerId = TestIds.Id(7);
        if (parentState == "missing") answer.ParentAnswer = null;
        report.Status = ReportStatus.Accepted;
        report.ResolutionNote = "Đã kiểm tra và xử lý nội dung.";

        var result = await Service(new FakeReports { Report = report }).GetMineAsync("reporter", null, 1, 10, default);

        var item = Assert.Single(Assert.IsType<PagedResultDto<MyReportDto>>(result).Items);
        Assert.Null(item.TopicId);
        Assert.Null(item.TargetTitle);
        Assert.Equal(TestIds.Id(9), item.TargetId);
        Assert.Equal("accepted", item.Status);
        Assert.Equal(report.ResolutionNote, item.ResolutionNote);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Mine_KeepsLinksForVisibleRootAndValidChild(bool isChild)
    {
        var report = CreateAnswerReport();
        if (!isChild)
        {
            report.Answer!.ParentAnswerId = null;
            report.Answer.ParentAnswer = null;
        }

        var result = await Service(new FakeReports { Report = report }).GetMineAsync("reporter", null, 1, 10, default);

        var item = Assert.Single(Assert.IsType<PagedResultDto<MyReportDto>>(result).Items);
        Assert.Equal(TestIds.Id(5), item.TopicId);
        Assert.Equal("Nội dung bí mật", item.TargetTitle);
        Assert.Equal("answer", item.TargetType);
        Assert.Equal(TestIds.Id(9), item.TargetId);
    }

    private static ContentReport CreateAnswerReport()
    {
        var report = CreateReport();
        var topic = report.Topic!;
        report.TopicId = null;
        report.Topic = null;
        report.AnswerId = TestIds.Id(9);
        report.Answer = new Answer
        {
            Id = TestIds.Id(9), TopicId = topic.Id, Topic = topic, AuthorId = "author", BodyHtml = "Phản hồi con",
            ParentAnswerId = TestIds.Id(8),
            ParentAnswer = new Answer
            {
                Id = TestIds.Id(8), TopicId = topic.Id, Topic = topic, AuthorId = "other", BodyHtml = "Trả lời gốc"
            }
        };
        return report;
    }

    [Fact]
    public async Task Resolve_PersistsNotificationAndAuditOnceWithDecision()
    {
        var repository = new FakeReports { Report = CreateReport() };
        var service = Service(repository);
        var first = await service.ResolveAsync(TestIds.Id(1), "admin", new("accepted", "  Đã xử lý spam  "), default);
        var second = await service.ResolveAsync(TestIds.Id(1), "admin", new("accepted", "Đã xử lý spam"), default);

        Assert.True(first.Succeeded);
        Assert.Equal(ErrorType.Conflict, second.Error);
        var notification = Assert.Single(repository.Notifications, item => item.UserId == "reporter");
        Assert.Equal($"report-resolved:{TestIds.Id(1)}", notification.SourceKey);
        Assert.Equal("/reports", notification.Link);
        Assert.Contains("Đã xử lý spam", notification.Message);
        Assert.DoesNotContain(TestIds.Id(1).ToString(), notification.Message);
        Assert.Equal("accepted", Assert.Single(repository.Audits, item => item.Action == "report.resolved").NewValue);
    }

    [Fact]
    public async Task Resolve_Accepting_HidesVisibleContentAndTellsTheAuthor()
    {
        var repository = new FakeReports { Report = CreateReport() };

        var result = await Service(repository).ResolveAsync(TestIds.Id(1), "admin", new("accepted", "Quảng cáo"), default);

        Assert.True(result.Succeeded);
        Assert.Equal(TestIds.Id(5), repository.HiddenTopicId);
        var author = Assert.Single(repository.Notifications, item => item.UserId == "author");
        Assert.Equal("content-moderated", author.Type);
        Assert.Contains("Quảng cáo", author.Message);
        Assert.Contains(repository.Audits, item => item.Action == "topic.hide" && item.NewValue == "hidden");
    }

    [Fact]
    public async Task Resolve_Rejecting_LeavesTheContentAsItIs()
    {
        var repository = new FakeReports { Report = CreateReport() };

        await Service(repository).ResolveAsync(TestIds.Id(1), "admin", new("rejected", "Không vi phạm"), default);

        Assert.Null(repository.HiddenTopicId);
        Assert.DoesNotContain(repository.Notifications, item => item.UserId == "author");
    }

    [Fact]
    public async Task Resolve_HandlesEveryPendingReportOfTheSameContentAtOnce()
    {
        var repository = new FakeReports
        {
            Report = CreateReport(),
            OtherPending = [new PendingReport(TestIds.Id(2), "second-reporter"), new PendingReport(TestIds.Id(3), "third-reporter")]
        };

        await Service(repository).ResolveAsync(TestIds.Id(1), "admin", new("accepted", "Spam"), default);

        Assert.Equal([TestIds.Id(1), TestIds.Id(2), TestIds.Id(3)], repository.ResolvedIds.Order());
        Assert.Equal(["reporter", "second-reporter", "third-reporter"],
            repository.Notifications.Where(item => item.Type == "report-resolved").Select(item => item.UserId).Order());
    }

    [Fact]
    public async Task Resolve_ConcurrentWinnerDoesNotProduceSecondNotification()
    {
        var repository = new FakeReports { Report = CreateReport(), ShouldResolve = false };
        var result = await Service(repository).ResolveAsync(TestIds.Id(1), "admin", new("rejected", "Chưa có vi phạm"), default);
        Assert.Equal(ErrorType.Conflict, result.Error);
        Assert.Empty(repository.Notifications);
        Assert.Empty(repository.Audits);
    }

    [Theory]
    [InlineData("", "reason")]
    [InlineData("accepted", " ")]
    public async Task Resolve_InvalidDecisionOrReasonDoesNotWrite(string decision, string reason)
    {
        var repository = new FakeReports { Report = CreateReport() };
        var result = await Service(repository).ResolveAsync(TestIds.Id(1), "admin", new(decision, reason), default);
        Assert.Equal(ErrorType.Validation, result.Error);
        Assert.Empty(repository.Notifications);
        Assert.Empty(repository.Audits);
    }

    [Fact]
    public async Task Admin_SanitizesLegacyHtmlBeforePreview()
    {
        var repository = new FakeReports { Report = CreateReport() };
        Assert.NotNull(repository.Report.Topic);
        repository.Report.Topic.BodyHtml = "<p onclick=\"alert(1)\">Nội dung<script>alert(1)</script></p>";
        var result = await Service(repository).GetAdminPageAsync(new AdminReportQuery { Status = null }, default);
        Assert.NotNull(result);
        var item = Assert.Single(result.Items);
        Assert.DoesNotContain("<script", item.TargetBodyHtml);
        Assert.DoesNotContain("onclick", item.TargetBodyHtml);
        Assert.Equal("author", item.TargetAuthor.Id);
    }

    [Fact]
    public async Task Create_WhenEnoughMembersReported_HidesTheTopicAndTellsTheAuthor()
    {
        var report = CreateReport();
        var repository = new FakeReports { Report = report, PendingReporters = 5 };

        var result = await Service(repository, report.Topic).CreateAsync(
            "reporter", new CreateReportRequest("topic", TestIds.Id(5), "spam", null), default);

        Assert.True(result.Succeeded);
        Assert.Equal(TestIds.Id(5), repository.AutoHiddenTopicId);
        var notification = Assert.Single(repository.Notifications);
        Assert.Equal("author", notification.UserId);
        Assert.Equal("content-auto-hidden", notification.Type);
    }

    [Fact]
    public async Task Create_BelowTheThreshold_LeavesTheTopicShown()
    {
        var report = CreateReport();
        var repository = new FakeReports { Report = report, PendingReporters = 4 };

        await Service(repository, report.Topic).CreateAsync(
            "reporter", new CreateReportRequest("topic", TestIds.Id(5), "spam", null), default);

        Assert.Null(repository.AutoHiddenTopicId);
        Assert.Empty(repository.Notifications);
    }

    [Fact]
    public async Task Create_CountsOnlyAccountsOlderThanTheMinimumAge()
    {
        var report = CreateReport();
        var repository = new FakeReports { Report = report };
        var before = DateTimeOffset.UtcNow.AddDays(-3);

        await Service(repository, report.Topic).CreateAsync(
            "reporter", new CreateReportRequest("topic", TestIds.Id(5), "spam", null), default);

        Assert.NotNull(repository.CountedAccountsBefore);
        Assert.True(repository.CountedAccountsBefore <= before.AddSeconds(5) && repository.CountedAccountsBefore >= before.AddSeconds(-5));
    }

    [Fact]
    public async Task Resolve_RejectingTheLastReportOfAutoHiddenContent_ShowsItAgain()
    {
        var report = CreateReport();
        report.Topic!.IsHiddenByModerator = true;
        report.Topic.AutoHiddenAtUtc = DateTimeOffset.UtcNow;
        var repository = new FakeReports { Report = report, PendingReporters = 0 };

        await Service(repository).ResolveAsync(TestIds.Id(1), "admin", new("rejected", "Không vi phạm"), default);

        Assert.Equal(TestIds.Id(5), repository.ShownAgainTopicId);
        Assert.Contains(repository.Notifications, item => item.Type == "content-restored" && item.UserId == "author");
    }

    [Fact]
    public async Task Resolve_RejectingWhileOtherReportsStillWait_KeepsItHidden()
    {
        var report = CreateReport();
        report.Topic!.IsHiddenByModerator = true;
        report.Topic.AutoHiddenAtUtc = DateTimeOffset.UtcNow;
        var repository = new FakeReports { Report = report, PendingReporters = 1 };

        await Service(repository).ResolveAsync(TestIds.Id(1), "admin", new("rejected", "Không vi phạm"), default);

        Assert.Null(repository.ShownAgainTopicId);
    }

    [Fact]
    public async Task Resolve_AcceptingAReportOfAutoHiddenContent_MakesTheHidingADecisionOfTheModerator()
    {
        var report = CreateReport();
        report.Topic!.IsHiddenByModerator = true;
        report.Topic.AutoHiddenAtUtc = DateTimeOffset.UtcNow;
        var repository = new FakeReports { Report = report };

        await Service(repository).ResolveAsync(TestIds.Id(1), "admin", new("accepted", "Vi phạm"), default);

        Assert.Equal(TestIds.Id(5), repository.HiddenTopicId);
        Assert.Null(repository.ShownAgainTopicId);
    }

    private static ContentReportService Service(FakeReports repository, Topic? publicTopic = null) =>
        new(repository, new UnusedTopics(publicTopic), TestMediaRules.CreateSanitizer(), TimeProvider.System,
            Options.Create(new ReportLimitOptions { AutoHideThreshold = 5, MinReporterAccountAgeDays = 3 }));

    private static ContentReport CreateReport()
    {
        var author = new ApplicationUser { Id = "author", DisplayName = "Tác giả", Email = "secret@example.test" };
        return new ContentReport
        {
            Id = TestIds.Id(1), TopicId = TestIds.Id(5), ReporterId = "reporter", Reporter = new() { Id = "reporter", DisplayName = "Người báo cáo" },
            Reason = "spam", Status = ReportStatus.Pending, CreatedAtUtc = DateTimeOffset.UtcNow,
            Topic = new Topic
            {
                Id = TestIds.Id(5), Title = "Nội dung bí mật", Slug = "chu-de", Summary = "Nội dung", BodyHtml = "<p>Nội dung</p>",
                AuthorId = author.Id, Author = author, Status = TopicStatus.Published, PublishedAtUtc = DateTimeOffset.UtcNow
            }
        };
    }

    private sealed class FakeReports : IContentReportRepository
    {
        public required ContentReport Report { get; init; }
        public bool ShouldResolve { get; init; } = true;
        public string? RequestedReporterId { get; private set; }
        public List<Notification> Notifications { get; } = [];
        public List<AdminAuditLog> Audits { get; } = [];
        public int PendingReporters { get; init; }
        public DateTimeOffset? CountedAccountsBefore { get; private set; }
        public Guid? AutoHiddenTopicId { get; private set; }
        public Guid? ShownAgainTopicId { get; private set; }
        public Guid? HiddenTopicId { get; private set; }
        public IReadOnlyList<PendingReport> OtherPending { get; init; } = [];
        public List<Guid> ResolvedIds { get; } = [];
        public Task<int> CountPendingReportersAsync(Guid? topicId, Guid? answerId, DateTimeOffset accountsCreatedBefore, CancellationToken cancellationToken)
        {
            CountedAccountsBefore = accountsCreatedBefore;
            return Task.FromResult(PendingReporters);
        }
        public Task<bool> HasAcceptedReportAsync(Guid? topicId, Guid? answerId, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> AutoHideAsync(Guid? topicId, Guid? answerId, DateTimeOffset now, Notification notification, CancellationToken cancellationToken)
        {
            AutoHiddenTopicId = topicId;
            Notifications.Add(notification);
            return Task.FromResult(true);
        }
        public Task<bool> ShowAutoHiddenAsync(Guid? topicId, Guid? answerId, Notification notification, CancellationToken cancellationToken)
        {
            ShownAgainTopicId = topicId;
            Notifications.Add(notification);
            return Task.FromResult(true);
        }
        public Task<Answer?> GetPublicAnswerAsync(Guid answerId, CancellationToken cancellationToken) => Task.FromResult<Answer?>(null);
        public Task<bool> PendingExistsAsync(string reporterId, Guid? topicId, Guid? answerId, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> AddAsync(ContentReport report, CancellationToken cancellationToken) => Task.FromResult(true);
        public Task<ContentReportPage> GetPageAsync(ReportFilter filter, int page, int pageSize, CancellationToken cancellationToken) => Task.FromResult(new ContentReportPage([Report], 1));
        public Task<IReadOnlyList<PendingReport>> GetPendingForTargetAsync(Guid? topicId, Guid? answerId, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<PendingReport>>(Report.Status == ReportStatus.Pending
                ? [new PendingReport(Report.Id, Report.ReporterId), .. OtherPending]
                : []);
        public Task<ContentReport?> GetByIdAsync(Guid id, CancellationToken cancellationToken) => Task.FromResult<ContentReport?>(Report);
        public Task<ContentReportPage> GetMineAsync(string reporterId, ReportStatus? status, int page, int pageSize, CancellationToken cancellationToken)
        {
            RequestedReporterId = reporterId;
            return Task.FromResult(new ContentReportPage([Report], 1));
        }
        public Task<bool> ResolvePendingAsync(IReadOnlyCollection<Guid> ids, ReportStatus status, string administratorId,
            DateTimeOffset resolvedAtUtc, string resolutionNote, Guid? topicId, Guid? answerId, bool hideTarget,
            IReadOnlyList<Notification> notifications, IReadOnlyList<AdminAuditLog> auditLogs, CancellationToken cancellationToken)
        {
            if (!ShouldResolve || Report.Status != ReportStatus.Pending) return Task.FromResult(false);
            Report.Status = status;
            Report.ResolutionNote = resolutionNote;
            Report.ResolvedAtUtc = resolvedAtUtc;
            ResolvedIds.AddRange(ids);
            if (hideTarget) HiddenTopicId = topicId;
            Notifications.AddRange(notifications);
            Audits.AddRange(auditLogs);
            return Task.FromResult(true);
        }
    }

    private sealed class UnusedTopics(Topic? publicTopic = null) : ITopicRepository
    {
        public Task<TopicPage> GetPublicPageAsync(TopicQuery query, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<TopicPage> GetFollowingPageAsync(string followerId, TopicQuery query, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<TopicPage> GetOwnedPageAsync(string authorId, TopicQuery query, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<Topic?> GetPublicByIdAsync(Guid id, CancellationToken cancellationToken) =>
            publicTopic is not null && publicTopic.Id == id ? Task.FromResult<Topic?>(publicTopic) : throw new NotSupportedException();
        public Task<Topic?> GetOwnedByIdAsync(Guid id, string authorId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<Category?> GetCategoryByIdAsync(Guid id, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<IReadOnlyList<Tag>> GetActiveTagsByIdsAsync(IReadOnlyCollection<Guid> ids, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<bool> HasPublicAnswersAsync(Guid topicId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<bool> TryAddAsync(Topic topic, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task SaveChangesAsync(CancellationToken cancellationToken) => throw new NotSupportedException();
    }
}
