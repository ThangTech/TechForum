using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;
using TechForum.Api.Services;
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
            Id = 9, Topic = report.Topic!, TopicId = 5, AuthorId = "author", BodyHtml = "Bí mật", IsHiddenByModerator = true
        };
        report.TopicId = null;
        report.Topic = null;
        report.AnswerId = 9;
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
        if (parentState == "different-topic") parent.TopicId = 99;
        if (parentState == "nested") parent.ParentAnswerId = 7;
        if (parentState == "missing") answer.ParentAnswer = null;
        report.Status = ReportStatus.Accepted;
        report.ResolutionNote = "Đã kiểm tra và xử lý nội dung.";

        var result = await Service(new FakeReports { Report = report }).GetMineAsync("reporter", null, 1, 10, default);

        var item = Assert.Single(Assert.IsType<PagedResultDto<MyReportDto>>(result).Items);
        Assert.Null(item.TopicId);
        Assert.Null(item.TargetTitle);
        Assert.Equal(9, item.TargetId);
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
        Assert.Equal(5, item.TopicId);
        Assert.Equal("Nội dung bí mật", item.TargetTitle);
        Assert.Equal("answer", item.TargetType);
        Assert.Equal(9, item.TargetId);
    }

    private static ContentReport CreateAnswerReport()
    {
        var report = CreateReport();
        var topic = report.Topic!;
        report.TopicId = null;
        report.Topic = null;
        report.AnswerId = 9;
        report.Answer = new Answer
        {
            Id = 9, TopicId = topic.Id, Topic = topic, AuthorId = "author", BodyHtml = "Phản hồi con",
            ParentAnswerId = 8,
            ParentAnswer = new Answer
            {
                Id = 8, TopicId = topic.Id, Topic = topic, AuthorId = "other", BodyHtml = "Trả lời gốc"
            }
        };
        return report;
    }

    [Fact]
    public async Task Resolve_PersistsNotificationAndAuditOnceWithDecision()
    {
        var repository = new FakeReports { Report = CreateReport() };
        var service = Service(repository);
        var first = await service.ResolveAsync(1, "admin", new("accepted", "  Đã xử lý spam  "), default);
        var second = await service.ResolveAsync(1, "admin", new("accepted", "Đã xử lý spam"), default);

        Assert.Equal(ResolveReportFailure.None, first.Failure);
        Assert.Equal(ResolveReportFailure.AlreadyResolved, second.Failure);
        var notification = Assert.Single(repository.Notifications);
        Assert.Equal("reporter", notification.UserId);
        Assert.Equal("report-resolved:1", notification.SourceKey);
        Assert.Equal("/reports", notification.Link);
        Assert.Contains("Đã xử lý spam", notification.Message);
        Assert.Equal("accepted", Assert.Single(repository.Audits).NewValue);
    }

    [Fact]
    public async Task Resolve_ConcurrentWinnerDoesNotProduceSecondNotification()
    {
        var repository = new FakeReports { Report = CreateReport(), ShouldResolve = false };
        var result = await Service(repository).ResolveAsync(1, "admin", new("rejected", "Chưa có vi phạm"), default);
        Assert.Equal(ResolveReportFailure.AlreadyResolved, result.Failure);
        Assert.Empty(repository.Notifications);
        Assert.Empty(repository.Audits);
    }

    [Theory]
    [InlineData("", "reason")]
    [InlineData("accepted", " ")]
    public async Task Resolve_InvalidDecisionOrReasonDoesNotWrite(string decision, string reason)
    {
        var repository = new FakeReports { Report = CreateReport() };
        var result = await Service(repository).ResolveAsync(1, "admin", new(decision, reason), default);
        Assert.Equal(ResolveReportFailure.Validation, result.Failure);
        Assert.Empty(repository.Notifications);
        Assert.Empty(repository.Audits);
    }

    [Fact]
    public async Task Admin_SanitizesLegacyHtmlBeforePreview()
    {
        var repository = new FakeReports { Report = CreateReport() };
        Assert.NotNull(repository.Report.Topic);
        repository.Report.Topic.BodyHtml = "<p onclick=\"alert(1)\">Nội dung<script>alert(1)</script></p>";
        var result = await Service(repository).GetAdminPageAsync(null, 1, 10, default);
        Assert.NotNull(result);
        var item = Assert.Single(result.Items);
        Assert.DoesNotContain("<script", item.TargetBodyHtml);
        Assert.DoesNotContain("onclick", item.TargetBodyHtml);
        Assert.Equal("author", item.TargetAuthor.Id);
    }

    private static ContentReportService Service(FakeReports repository) =>
        new(repository, new UnusedTopics(), new ContentSanitizer(), TimeProvider.System);

    private static ContentReport CreateReport()
    {
        var author = new ApplicationUser { Id = "author", DisplayName = "Tác giả", Email = "secret@example.test" };
        return new ContentReport
        {
            Id = 1, TopicId = 5, ReporterId = "reporter", Reporter = new() { Id = "reporter", DisplayName = "Người báo cáo" },
            Reason = "spam", Status = ReportStatus.Pending, CreatedAtUtc = DateTimeOffset.UtcNow,
            Topic = new Topic
            {
                Id = 5, Title = "Nội dung bí mật", Slug = "chu-de", Summary = "Nội dung", BodyHtml = "<p>Nội dung</p>",
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
        public Task<Answer?> GetPublicAnswerAsync(int answerId, CancellationToken cancellationToken) => Task.FromResult<Answer?>(null);
        public Task<bool> PendingExistsAsync(string reporterId, int? topicId, int? answerId, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> AddAsync(ContentReport report, CancellationToken cancellationToken) => Task.FromResult(true);
        public Task<ContentReportPage> GetPageAsync(ReportStatus? status, int page, int pageSize, CancellationToken cancellationToken) => Task.FromResult(new ContentReportPage([Report], 1));
        public Task<ContentReport?> GetByIdAsync(int id, CancellationToken cancellationToken) => Task.FromResult<ContentReport?>(Report);
        public Task<ContentReportPage> GetMineAsync(string reporterId, ReportStatus? status, int page, int pageSize, CancellationToken cancellationToken)
        {
            RequestedReporterId = reporterId;
            return Task.FromResult(new ContentReportPage([Report], 1));
        }
        public Task<bool> ResolvePendingAsync(int id, ReportStatus status, string administratorId,
            DateTimeOffset resolvedAtUtc, string resolutionNote, Notification notification, AdminAuditLog auditLog,
            CancellationToken cancellationToken)
        {
            if (!ShouldResolve) return Task.FromResult(false);
            Report.Status = status;
            Report.ResolutionNote = resolutionNote;
            Report.ResolvedAtUtc = resolvedAtUtc;
            Notifications.Add(notification);
            Audits.Add(auditLog);
            return Task.FromResult(true);
        }
    }

    private sealed class UnusedTopics : ITopicRepository
    {
        public Task<TopicPage> GetPublicPageAsync(TopicQuery query, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<TopicPage> GetFollowingPageAsync(string followerId, TopicQuery query, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<TopicPage> GetOwnedPageAsync(string authorId, TopicQuery query, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<Topic?> GetPublicByIdAsync(int id, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<Topic?> GetOwnedByIdAsync(int id, string authorId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<Category?> GetCategoryByIdAsync(int id, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<IReadOnlyList<Tag>> GetActiveTagsByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<bool> HasPublicAnswersAsync(int topicId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task AddAsync(Topic topic, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task SaveChangesAsync(CancellationToken cancellationToken) => throw new NotSupportedException();
    }
}
