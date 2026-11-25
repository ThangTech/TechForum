using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class ContentReportService : IContentReportService
{
    private static readonly HashSet<string> Reasons = new(StringComparer.OrdinalIgnoreCase)
    { "spam", "harassment", "misinformation", "copyright", "other" };

    private readonly IContentReportRepository reportRepository;
    private readonly ITopicRepository topicRepository;
    private readonly IContentSanitizer contentSanitizer;
    private readonly TimeProvider timeProvider;
    private readonly IOptions<ReportLimitOptions> reportLimits;

    public ContentReportService(
        IContentReportRepository reportRepository,
        ITopicRepository topicRepository,
        IContentSanitizer contentSanitizer,
        TimeProvider timeProvider,
        IOptions<ReportLimitOptions> reportLimits)
    {
        this.reportRepository = reportRepository;
        this.topicRepository = topicRepository;
        this.contentSanitizer = contentSanitizer;
        this.timeProvider = timeProvider;
        this.reportLimits = reportLimits;
    }

    public async Task<Result<ReportReceiptDto>> CreateAsync(
        string reporterId,
        CreateReportRequest request,
        CancellationToken cancellationToken)
    {
        var targetType = request.TargetType?.Trim().ToLowerInvariant();
        if ((targetType != "topic" && targetType != "answer") || request.TargetId == Guid.Empty)
        {
            return Result<ReportReceiptDto>.Fail(ErrorType.Validation, null, "Nội dung cần báo cáo không hợp lệ.", "targetId");
        }

        var reason = request.Reason?.Trim().ToLowerInvariant();
        if (reason is null || !Reasons.Contains(reason))
        {
            return Result<ReportReceiptDto>.Fail(ErrorType.Validation, null, "Lý do báo cáo không hợp lệ.", "reason");
        }

        var details = request.Details?.Trim();
        if (details?.Length > 1000)
        {
            return Result<ReportReceiptDto>.Fail(ErrorType.Validation, null, "Mô tả không được vượt quá 1.000 ký tự.", "details");
        }
        if (reason == "other" && string.IsNullOrWhiteSpace(details))
        {
            return Result<ReportReceiptDto>.Fail(ErrorType.Validation, null, "Vui lòng mô tả lý do khác.", "details");
        }

        Guid? topicId = targetType == "topic" ? request.TargetId : null;
        Guid? answerId = targetType == "answer" ? request.TargetId : null;
        var topic = topicId.HasValue ? await topicRepository.GetPublicByIdAsync(topicId.Value, cancellationToken) : null;
        var answer = answerId.HasValue ? await reportRepository.GetPublicAnswerAsync(answerId.Value, cancellationToken) : null;
        if (topic is null && answer is null)
        {
            return Result<ReportReceiptDto>.Fail(ErrorType.NotFound, "Không tìm thấy nội dung", "Nội dung không tồn tại hoặc không còn công khai.");
        }

        if (await reportRepository.PendingExistsAsync(reporterId, topicId, answerId, cancellationToken))
        {
            return Result<ReportReceiptDto>.Fail(ErrorType.Conflict, "Báo cáo đang chờ xử lý", "Bạn đã gửi báo cáo cho nội dung này và báo cáo đang chờ xử lý.");
        }

        var report = new ContentReport
        {
            TopicId = topicId,
            AnswerId = answerId,
            ReporterId = reporterId,
            Reason = reason,
            Details = details,
            Status = ReportStatus.Pending,
            CreatedAtUtc = timeProvider.GetUtcNow()
        };
        if (!await reportRepository.AddAsync(report, cancellationToken))
        {
            return Result<ReportReceiptDto>.Fail(ErrorType.Conflict, "Báo cáo đang chờ xử lý", "Bạn đã gửi báo cáo cho nội dung này và báo cáo đang chờ xử lý.");
        }
        await HideWhenReportedByManyAsync(topic, answer, cancellationToken);
        return Result<ReportReceiptDto>.Success(new ReportReceiptDto(
            report.Id, targetType, request.TargetId, reason, details, "pending", report.CreatedAtUtc));
    }

    // Trạng thái đã được kiểm tra ở query (AdminReportQuery, MyReportQuery); để trống thì lấy mọi trạng thái.
    private static ReportStatus? ParseStatus(string? status)
    {
        if (Enum.TryParse<ReportStatus>(status?.Trim(), true, out var parsed))
        {
            return parsed;
        }

        return null;
    }

    public async Task<PagedResultDto<AdminReportDto>> GetAdminPageAsync(
        AdminReportQuery query,
        CancellationToken cancellationToken)
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 50);
        var targetType = query.TargetType?.Trim().ToLowerInvariant();
        bool? isAnswer = null;
        if (targetType == "answer")
        {
            isAnswer = true;
        }
        else if (targetType == "topic")
        {
            isAnswer = false;
        }
        var reason = string.IsNullOrWhiteSpace(query.Reason) ? null : query.Reason.Trim().ToLowerInvariant();
        var filter = new ReportFilter(ParseStatus(query.Status), isAnswer, reason);
        var result = await reportRepository.GetPageAsync(filter, page, pageSize, cancellationToken);
        return new PagedResultDto<AdminReportDto>(
            result.Items.Select(report => MapAdminReport(report, result.Summaries?.GetValueOrDefault(report.Id))).ToList(),
            page,
            pageSize,
            result.TotalItems,
            (int)Math.Ceiling(result.TotalItems / (double)pageSize));
    }

    public async Task<Result<AdminReportDto>> ResolveAsync(
        Guid reportId,
        string administratorId,
        ResolveReportRequest request,
        CancellationToken cancellationToken)
    {
        var decision = request.Decision?.Trim().ToLowerInvariant();
        ReportStatus? status = null;
        if (decision == "accepted")
        {
            status = ReportStatus.Accepted;
        }
        else if (decision == "rejected")
        {
            status = ReportStatus.Rejected;
        }
        if (!status.HasValue)
        {
            return Result<AdminReportDto>.Fail(ErrorType.Validation, null, "Quyết định phải là accepted hoặc rejected.", "decision");
        }

        var note = request.ResolutionNote?.Trim();
        if (string.IsNullOrWhiteSpace(note))
        {
            return Result<AdminReportDto>.Fail(ErrorType.Validation, null, "Vui lòng ghi lý do xử lý báo cáo.", "resolutionNote");
        }
        if (note.Length > 1000)
        {
            return Result<AdminReportDto>.Fail(ErrorType.Validation, null, "Lý do xử lý không được vượt quá 1.000 ký tự.", "resolutionNote");
        }

        var existing = await reportRepository.GetByIdAsync(reportId, cancellationToken);
        if (existing is null)
        {
            return Result<AdminReportDto>.Fail(ErrorType.NotFound, "Không tìm thấy báo cáo", "Không tìm thấy báo cáo.");
        }
        if (existing.Status != ReportStatus.Pending)
        {
            return Result<AdminReportDto>.Fail(ErrorType.Conflict, "Báo cáo đã được xử lý", "Báo cáo này đã được xử lý trước đó.");
        }

        // Mọi báo cáo đang chờ về cùng nội dung được xử lý một lần, như các diễn đàn lớn gộp cờ báo cáo theo bài.
        var pending = await reportRepository.GetPendingForTargetAsync(existing.TopicId, existing.AnswerId, cancellationToken);
        if (pending.All(item => item.Id != existing.Id))
        {
            pending = [.. pending, new PendingReport(existing.Id, existing.ReporterId)];
        }

        var now = timeProvider.GetUtcNow();
        var accepted = status == ReportStatus.Accepted;
        // Chấp nhận nghĩa là nội dung vi phạm: ẩn khỏi trang công khai (nếu chưa bị xoá) và báo cho tác giả.
        var hideTarget = accepted && !IsTargetDeleted(existing);
        var (authorId, title, kind) = DescribeTarget(existing.Topic, existing.Answer);
        var notifications = pending
            .Select(item => new Notification
            {
                UserId = item.ReporterId,
                Type = "report-resolved",
                Title = "Báo cáo đã được xử lý",
                Message = accepted
                    ? $"Báo cáo của bạn về “{title}” được chấp nhận, nội dung đã bị ẩn. Lý do: {note}"
                    : $"Báo cáo của bạn về “{title}” không được chấp nhận. Lý do: {note}",
                Link = "/reports",
                SourceKey = $"report-resolved:{item.Id}",
                CreatedAtUtc = now
            })
            .ToList();
        var auditLogs = new List<AdminAuditLog>
        {
            new()
            {
                AdministratorId = administratorId,
                Action = "report.resolved",
                TargetType = "report",
                TargetId = existing.Id.ToString(),
                PreviousValue = "pending",
                NewValue = status.Value.ToString().ToLowerInvariant(),
                Reason = pending.Count > 1 ? $"{note} (xử lý cùng {pending.Count} báo cáo)" : note,
                CreatedAtUtc = now
            }
        };
        if (hideTarget)
        {
            notifications.Add(new Notification
            {
                UserId = authorId,
                Type = "content-moderated",
                Title = $"{kind} của bạn đã bị ẩn",
                Message = $"{kind} trong “{title}” bị ẩn sau khi quản trị viên xem xét báo cáo. Lý do: {note}",
                Link = existing.TopicId.HasValue ? "/my-topics" : $"/topics/{existing.Answer!.TopicId}",
                SourceKey = $"content-moderated:{existing.TopicId ?? existing.AnswerId}:{now.ToUnixTimeSeconds()}",
                CreatedAtUtc = now
            });
            auditLogs.Add(new AdminAuditLog
            {
                AdministratorId = administratorId,
                Action = existing.TopicId.HasValue ? "topic.hide" : "answer.hide",
                TargetType = existing.TopicId.HasValue ? "topic" : "answer",
                TargetId = (existing.TopicId ?? existing.AnswerId!.Value).ToString(),
                PreviousValue = IsTargetHidden(existing) ? "hidden" : "visible",
                NewValue = "hidden",
                Reason = note,
                CreatedAtUtc = now
            });
        }

        var resolved = await reportRepository.ResolvePendingAsync(
            pending.Select(item => item.Id).ToList(),
            status.Value,
            administratorId,
            now,
            note,
            existing.TopicId,
            existing.AnswerId,
            hideTarget,
            notifications,
            auditLogs,
            cancellationToken);
        if (!resolved)
        {
            return Result<AdminReportDto>.Fail(ErrorType.Conflict, "Báo cáo đã được xử lý", "Báo cáo này vừa được quản trị viên khác xử lý.");
        }

        if (!accepted)
        {
            await ShowAgainWhenRejectedAsync(existing, cancellationToken);
        }

        var updated = await reportRepository.GetByIdAsync(reportId, cancellationToken)
            ?? throw new InvalidOperationException("Báo cáo vừa xử lý không còn tồn tại.");
        return Result<AdminReportDto>.Success(MapAdminReport(updated, null));
    }

    private static bool IsTargetDeleted(ContentReport report)
    {
        return report.Answer is not null ? report.Answer.IsDeleted : report.Topic?.IsDeleted == true;
    }

    private static bool IsTargetHidden(ContentReport report)
    {
        return report.Answer is not null ? report.Answer.IsHiddenByModerator : report.Topic?.IsHiddenByModerator == true;
    }

    // Đủ số người khác nhau (tài khoản đủ tuổi) có báo cáo đang chờ thì nội dung tự ẩn tới khi quản trị viên xem,
    // và tác giả được báo.
    private async Task HideWhenReportedByManyAsync(Topic? topic, Answer? answer, CancellationToken cancellationToken)
    {
        var limits = reportLimits.Value;
        var now = timeProvider.GetUtcNow();
        var reporters = await reportRepository.CountPendingReportersAsync(
            topic?.Id, answer?.Id, now.AddDays(-Math.Max(0, limits.MinReporterAccountAgeDays)), cancellationToken);
        if (reporters < Math.Max(1, limits.AutoHideThreshold))
        {
            return;
        }

        var (authorId, title, kind) = DescribeTarget(topic, answer);
        await reportRepository.AutoHideAsync(topic?.Id, answer?.Id, now, new Notification
        {
            UserId = authorId,
            Type = "content-auto-hidden",
            Title = $"{kind} của bạn đang tạm ẩn",
            Message = $"{kind} trong \"{title}\" nhận nhiều báo cáo nên được tạm ẩn trong lúc quản trị viên xem xét. " +
                "Nếu báo cáo không đúng, nội dung sẽ được hiển thị lại.",
            Link = topic is not null ? "/my-topics" : $"/topics/{answer!.TopicId}",
            SourceKey = $"content-auto-hidden:{topic?.Id ?? answer!.Id}:{now.ToUnixTimeSeconds()}",
            CreatedAtUtc = now
        }, cancellationToken);
    }

    // Từ chối các báo cáo của nội dung đang tự ẩn thì hiện lại nội dung (trừ khi đã có báo cáo khác được chấp nhận).
    private async Task ShowAgainWhenRejectedAsync(ContentReport report, CancellationToken cancellationToken)
    {
        var target = (Hidden: report.Topic?.AutoHiddenAtUtc ?? report.Answer?.AutoHiddenAtUtc, report.TopicId, report.AnswerId);
        if (target.Hidden is null)
        {
            return;
        }

        var now = timeProvider.GetUtcNow();
        // Ở đây tính mọi báo cáo đang chờ, kể cả của tài khoản mới, vì quản trị viên chưa xem tới.
        var stillWaiting = await reportRepository.CountPendingReportersAsync(
            target.TopicId, target.AnswerId, DateTimeOffset.MaxValue, cancellationToken);
        if (stillWaiting > 0 ||
            await reportRepository.HasAcceptedReportAsync(target.TopicId, target.AnswerId, cancellationToken))
        {
            return;
        }

        var (authorId, title, kind) = DescribeTarget(report.Topic, report.Answer);
        await reportRepository.ShowAutoHiddenAsync(target.TopicId, target.AnswerId, new Notification
        {
            UserId = authorId,
            Type = "content-restored",
            Title = $"{kind} của bạn đã hiển thị lại",
            Message = $"Quản trị viên đã xem xét báo cáo về {kind.ToLowerInvariant()} trong \"{title}\" và hiển thị lại nội dung.",
            Link = report.Topic is not null ? $"/topics/{report.Topic.Id}" : $"/topics/{report.Answer!.TopicId}#answer-{report.Answer.Id}",
            SourceKey = $"content-restored:{target.TopicId ?? target.AnswerId}:{now.ToUnixTimeSeconds()}",
            CreatedAtUtc = now
        }, cancellationToken);
    }

    // Câu trả lời công khai khi nó và câu trả lời cha (nếu là phản hồi) đều chưa bị xóa hay ẩn, cùng một chủ đề.
    private static bool IsAnswerPublic(Answer? answer)
    {
        if (answer == null || answer.IsDeleted || answer.IsHiddenByModerator)
        {
            return false;
        }
        if (answer.ParentAnswerId is null)
        {
            return true;
        }

        var parent = answer.ParentAnswer;
        return parent != null && parent.ParentAnswerId == null && !parent.IsDeleted && !parent.IsHiddenByModerator &&
            parent.TopicId == answer.TopicId;
    }

    private static (string AuthorId, string Title, string Kind) DescribeTarget(Topic? topic, Answer? answer)
    {
        return topic is not null
            ? (topic.AuthorId, topic.Title, "Bài viết")
            : (answer!.AuthorId, answer.Topic.Title, "Câu trả lời");
    }

    public async Task<PagedResultDto<MyReportDto>> GetMineAsync(
        string reporterId, string? status, int page, int pageSize, CancellationToken cancellationToken)
    {
        var parsedStatus = ParseStatus(status);
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var result = await reportRepository.GetMineAsync(reporterId, parsedStatus, page, pageSize, cancellationToken);
        var items = result.Items.Select(report =>
        {
            var topic = report.Topic ?? report.Answer?.Topic;
            var answer = report.Answer;
            var isAnswerPublic = report.AnswerId is null || IsAnswerPublic(answer);
            // Chỉ liên kết lại tài nguyên còn công khai; không lộ bản nháp hoặc nội dung đã bị ẩn.
            var isPublic = TopicVisibility.IsPublicTopic(topic) && isAnswerPublic;
            return new MyReportDto(report.Id, report.TopicId.HasValue ? "topic" : "answer",
                report.TopicId ?? report.AnswerId!.Value, isPublic ? topic!.Id : null,
                isPublic ? topic!.Title : null, report.Reason, report.Details,
                report.Status.ToString().ToLowerInvariant(), report.CreatedAtUtc,
                report.ResolvedAtUtc, report.ResolutionNote);
        }).ToList();
        return new PagedResultDto<MyReportDto>(items, page, pageSize, result.TotalItems,
            (int)Math.Ceiling(result.TotalItems / (double)pageSize));
    }

    private AdminReportDto MapAdminReport(ContentReport report, ReportTargetSummary? summary)
    {
        var topic = report.Topic ?? report.Answer?.Topic
            ?? throw new InvalidOperationException("Báo cáo thiếu nội dung đích.");
        var targetType = report.TopicId.HasValue ? "topic" : "answer";
        var targetId = report.TopicId ?? report.AnswerId!.Value;
        var bodyHtml = report.Topic?.BodyHtml ?? report.Answer?.BodyHtml
            ?? throw new InvalidOperationException("Báo cáo thiếu nội dung hiển thị.");
        var author = report.Topic?.Author ?? report.Answer?.Author
            ?? throw new InvalidOperationException("Báo cáo thiếu tác giả nội dung.");
        return new AdminReportDto(
            report.Id,
            targetType,
            targetId,
            topic.Title,
            contentSanitizer.Sanitize(bodyHtml),
            new ReportUserDto(report.Reporter.Id, report.Reporter.DisplayName),
            report.Reason,
            report.Details,
            report.Status.ToString().ToLowerInvariant(),
            report.CreatedAtUtc,
            report.ResolvedBy is null ? null : new ReportUserDto(report.ResolvedBy.Id, report.ResolvedBy.DisplayName),
            report.ResolvedAtUtc,
            report.ResolutionNote,
            topic.Id,
            new ReportUserDto(author.Id, author.DisplayName),
            topic.IsHiddenByModerator || report.Answer?.IsHiddenByModerator == true,
            (report.Answer is null ? topic.AutoHiddenAtUtc : report.Answer.AutoHiddenAtUtc) is not null,
            topic.IsDeleted || report.Answer?.IsDeleted == true,
            report.Answer?.ParentAnswer is null ? null : contentSanitizer.Sanitize(report.Answer.ParentAnswer.BodyHtml),
            summary?.PendingCount ?? 0,
            summary?.Reasons ?? []);
    }
}
