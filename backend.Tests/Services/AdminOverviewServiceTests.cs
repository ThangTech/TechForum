using System.ComponentModel.DataAnnotations;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class AdminOverviewServiceTests
{
    private static readonly DateTimeOffset CurrentTime = new(2026, 10, 20, 18, 30, 0, TimeSpan.Zero);

    [Fact]
    public async Task Dashboard_DefaultRangeUsesVietnamTodayAndThirtyInclusiveDays()
    {
        var repository = new FakeRepository();
        var result = await CreateService(repository).GetDashboardAsync(null, null, CancellationToken.None);

        var dashboard = Assert.IsType<AdminDashboardDto>(result.Dashboard);
        Assert.Equal(new DateOnly(2026, 9, 22), dashboard.StartDate);
        Assert.Equal(new DateOnly(2026, 10, 21), dashboard.EndDate);
        Assert.Equal("Asia/Ho_Chi_Minh", dashboard.TimeZone);
        Assert.Equal(30, dashboard.ActivitySeries.Count);
        Assert.Equal(new DateTimeOffset(2026, 9, 21, 17, 0, 0, TimeSpan.Zero), repository.StartUtc);
        Assert.Equal(new DateTimeOffset(2026, 10, 21, 17, 0, 0, TimeSpan.Zero), repository.EndUtcExclusive);
    }

    [Fact]
    public async Task Dashboard_GroupsCountsAndFillsMissingDaysWithoutChangingTotals()
    {
        var repository = new FakeRepository
        {
            Dashboard = EmptyData() with
            {
                Activity = [
                    new(new DateTime(2026, 10, 1), 2, 0, 0, 0),
                    new(new DateTime(2026, 10, 1), 0, 3, 1, 0),
                    new(new DateTime(2026, 10, 3), 0, 0, 0, 4)],
                Categories = [new(7, "Lập trình", 3, 1)]
            }
        };
        var result = await CreateService(repository).GetDashboardAsync(
            new(2026, 10, 1), new(2026, 10, 3), CancellationToken.None);

        var dashboard = Assert.IsType<AdminDashboardDto>(result.Dashboard);
        Assert.Equal(new AdminPeriodDto(2, 3, 1, 4), dashboard.Period);
        Assert.Equal(new AdminActivityPointDto(new(2026, 10, 2), 0, 0, 0, 0), dashboard.ActivitySeries[1]);
        Assert.Equal(4, Assert.Single(dashboard.Categories).TopicCount);
        Assert.Equal(10, dashboard.Totals.AccountCount);
        Assert.Equal(6, dashboard.PendingReports.Count);
    }

    [Theory]
    [InlineData("2026-10-02", "2026-10-01")]
    [InlineData("2025-01-01", "2026-01-02")]
    [InlineData("0001-01-01", "0001-01-02")]
    [InlineData("9999-12-30", "9999-12-31")]
    public async Task Dashboard_RejectsInvalidRangeBeforeReadingData(string start, string end)
    {
        var repository = new FakeRepository();
        var result = await CreateService(repository).GetDashboardAsync(
            DateOnly.Parse(start), DateOnly.Parse(end), CancellationToken.None);

        Assert.Null(result.Dashboard);
        Assert.NotEmpty(result.Errors);
        Assert.Equal(0, repository.DashboardReads);
    }

    [Fact]
    public async Task Dashboard_Accepts366DaysAndFutureEmptyDates()
    {
        var repository = new FakeRepository();
        var result = await CreateService(repository).GetDashboardAsync(
            new(2028, 1, 1), new(2028, 12, 31), CancellationToken.None);

        Assert.Equal(366, Assert.IsType<AdminDashboardDto>(result.Dashboard).ActivitySeries.Count);
    }

    [Theory]
    [InlineData(TopicStatus.Draft, false, false)]
    [InlineData(TopicStatus.Published, true, false)]
    [InlineData(TopicStatus.Published, false, true)]
    public async Task Dashboard_DoesNotExposePrivateTargetTitle(
        TopicStatus status, bool deleted, bool hidden)
    {
        var topic = CreateTopic();
        topic.Status = status;
        topic.IsDeleted = deleted;
        topic.IsHiddenByModerator = hidden;
        var repository = new FakeRepository
        {
            Dashboard = EmptyData() with { OldestPendingReports = [CreateReport(topic)] }
        };

        var result = await CreateService(repository).GetDashboardAsync(null, null, CancellationToken.None);

        var report = Assert.Single(result.Dashboard!.PendingReports.Oldest);
        Assert.Equal("Nội dung không còn công khai", report.TargetTitle);
        Assert.DoesNotContain("Bản nháp bí mật", report.TargetTitle);
    }

    [Fact]
    public async Task Dashboard_AlsoHidesTitleWhenReportedAnswerIsHidden()
    {
        var topic = CreateTopic();
        var report = CreateReport(topic);
        report.TopicId = null;
        report.Topic = null;
        report.AnswerId = 9;
        report.Answer = new Answer
        {
            Id = 9, TopicId = topic.Id, Topic = topic, AuthorId = "member", BodyHtml = "Reply",
            IsHiddenByModerator = true
        };
        var repository = new FakeRepository
        {
            Dashboard = EmptyData() with { OldestPendingReports = [report] }
        };

        var result = await CreateService(repository).GetDashboardAsync(null, null, CancellationToken.None);

        var item = Assert.Single(result.Dashboard!.PendingReports.Oldest);
        Assert.Equal("answer", item.TargetType);
        Assert.Equal(9, item.TargetId);
        Assert.Equal("Nội dung không còn công khai", item.TargetTitle);
    }

    [Fact]
    public async Task Audit_UsesTrimmedFiltersAndInclusiveVietnamDateBounds()
    {
        var repository = new FakeRepository();
        await CreateService(repository).GetAuditPageAsync(new AdminAuditQuery
        {
            Page = 2, PageSize = 10, Keyword = "  khóa  ", AdministratorId = " admin ",
            Action = " account-locked ", From = new(2026, 10, 1), To = new(2026, 10, 2)
        }, CancellationToken.None);

        Assert.Equal(2, repository.Page);
        Assert.Equal(10, repository.PageSize);
        Assert.Equal(new AdminAuditFilter("khóa", "admin", "account-locked",
            new(2026, 9, 30, 17, 0, 0, TimeSpan.Zero),
            new(2026, 10, 2, 17, 0, 0, TimeSpan.Zero)), repository.AuditFilter);
    }

    [Fact]
    public void AuditQuery_RejectsReversedDatesAndUnboundedPageSize()
    {
        var query = new AdminAuditQuery
        {
            From = new(2026, 10, 2), To = new(2026, 10, 1), PageSize = 100
        };
        var errors = new List<ValidationResult>();

        Assert.False(Validator.TryValidateObject(query, new ValidationContext(query), errors, true));
        Assert.NotEmpty(query.Validate(new ValidationContext(query)));
    }

    private static AdminOverviewService CreateService(FakeRepository repository) =>
        new(repository, new FixedTimeProvider());

    private static AdminDashboardData EmptyData() => new(
        new(10, 3, 2, 4, 6), [], [], new(0, 0, 0, 0), [], []);

    private static Topic CreateTopic() => new()
    {
        Id = 1, AuthorId = "member", Title = "Bản nháp bí mật", Slug = "private",
        Summary = "Summary", BodyHtml = "Body", Status = TopicStatus.Published,
        PublishedAtUtc = CurrentTime
    };

    private static ContentReport CreateReport(Topic topic) => new()
    {
        Id = 1, TopicId = topic.Id, Topic = topic, ReporterId = "reporter", Reason = "spam",
        Reporter = new ApplicationUser { Id = "reporter", DisplayName = "Người báo cáo" }
    };

    private sealed class FixedTimeProvider : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => CurrentTime;
    }

    private sealed class FakeRepository : IAdminOverviewRepository
    {
        public AdminDashboardData Dashboard { get; init; } = EmptyData();
        public DateTimeOffset StartUtc { get; private set; }
        public DateTimeOffset EndUtcExclusive { get; private set; }
        public int DashboardReads { get; private set; }
        public int Page { get; private set; }
        public int PageSize { get; private set; }
        public AdminAuditFilter? AuditFilter { get; private set; }

        public Task<AdminStatisticsData> GetStatisticsAsync(CancellationToken cancellationToken) =>
            Task.FromResult(Dashboard.Totals);

        public Task<AdminDashboardData> GetDashboardAsync(
            DateTimeOffset startUtc, DateTimeOffset endUtcExclusive, CancellationToken cancellationToken)
        {
            StartUtc = startUtc;
            EndUtcExclusive = endUtcExclusive;
            DashboardReads++;
            return Task.FromResult(Dashboard);
        }

        public Task<AdminAuditPage> GetAuditPageAsync(
            int page, int pageSize, AdminAuditFilter filter, CancellationToken cancellationToken)
        {
            Page = page;
            PageSize = pageSize;
            AuditFilter = filter;
            return Task.FromResult(new AdminAuditPage([], 0));
        }
    }
}
