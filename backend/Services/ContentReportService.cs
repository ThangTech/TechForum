using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class ContentReportService(
    IContentReportRepository reportRepository,
    ITopicRepository topicRepository,
    TimeProvider timeProvider) : IContentReportService
{
    private static readonly HashSet<string> Reasons = new(StringComparer.OrdinalIgnoreCase)
    { "spam", "harassment", "misinformation", "copyright", "other" };

    public async Task<CreateReportResult> CreateAsync(
        string reporterId,
        CreateReportRequest request,
        CancellationToken cancellationToken)
    {
        var targetType = request.TargetType?.Trim().ToLowerInvariant();
        if (targetType is not ("topic" or "answer") || request.TargetId <= 0)
            return CreateReportResult.Failed(CreateReportFailure.Validation, "Nội dung cần báo cáo không hợp lệ.", "targetId");

        var reason = request.Reason?.Trim().ToLowerInvariant();
        if (reason is null || !Reasons.Contains(reason))
            return CreateReportResult.Failed(CreateReportFailure.Validation, "Lý do báo cáo không hợp lệ.", "reason");

        var details = request.Details?.Trim();
        if (details?.Length > 1000)
            return CreateReportResult.Failed(CreateReportFailure.Validation, "Mô tả không được vượt quá 1.000 ký tự.", "details");
        if (reason == "other" && string.IsNullOrWhiteSpace(details))
            return CreateReportResult.Failed(CreateReportFailure.Validation, "Vui lòng mô tả lý do khác.", "details");

        int? topicId = targetType == "topic" ? request.TargetId : null;
        int? answerId = targetType == "answer" ? request.TargetId : null;
        var exists = topicId.HasValue
            ? await topicRepository.GetPublicByIdAsync(topicId.Value, cancellationToken) is not null
            : await reportRepository.GetPublicAnswerAsync(answerId!.Value, cancellationToken) is not null;
        if (!exists) return CreateReportResult.Failed(CreateReportFailure.TargetNotFound, "Nội dung không tồn tại hoặc không còn công khai.");

        if (await reportRepository.PendingExistsAsync(reporterId, topicId, answerId, cancellationToken))
            return CreateReportResult.Failed(CreateReportFailure.Duplicate, "Bạn đã gửi báo cáo cho nội dung này và báo cáo đang chờ xử lý.");

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
            return CreateReportResult.Failed(CreateReportFailure.Duplicate, "Bạn đã gửi báo cáo cho nội dung này và báo cáo đang chờ xử lý.");
        return CreateReportResult.Success(new ReportReceiptDto(
            report.Id, targetType, request.TargetId, reason, details, "pending", report.CreatedAtUtc));
    }

    public async Task<PagedResultDto<AdminReportDto>?> GetAdminPageAsync(
        string? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        ReportStatus? parsedStatus = status?.Trim().ToLowerInvariant() switch
        {
            null or "" => null,
            "pending" => ReportStatus.Pending,
            "accepted" => ReportStatus.Accepted,
            "rejected" => ReportStatus.Rejected,
            _ => (ReportStatus?)null
        };
        if (!string.IsNullOrWhiteSpace(status) && !parsedStatus.HasValue) return null;

        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var result = await reportRepository.GetPageAsync(parsedStatus, page, pageSize, cancellationToken);
        return new PagedResultDto<AdminReportDto>(
            result.Items.Select(MapAdminReport).ToList(),
            page,
            pageSize,
            result.TotalItems,
            (int)Math.Ceiling(result.TotalItems / (double)pageSize));
    }

    public async Task<ResolveReportResult> ResolveAsync(
        int reportId,
        string administratorId,
        ResolveReportRequest request,
        CancellationToken cancellationToken)
    {
        var status = request.Decision?.Trim().ToLowerInvariant() switch
        {
            "accepted" => ReportStatus.Accepted,
            "rejected" => ReportStatus.Rejected,
            _ => (ReportStatus?)null
        };
        if (!status.HasValue)
            return ResolveReportResult.Failed(ResolveReportFailure.Validation, "Quyết định phải là accepted hoặc rejected.", "decision");

        var note = request.ResolutionNote?.Trim();
        if (string.IsNullOrWhiteSpace(note))
            return ResolveReportResult.Failed(ResolveReportFailure.Validation, "Vui lòng ghi lý do xử lý báo cáo.", "resolutionNote");
        if (note.Length > 1000)
            return ResolveReportResult.Failed(ResolveReportFailure.Validation, "Lý do xử lý không được vượt quá 1.000 ký tự.", "resolutionNote");

        var existing = await reportRepository.GetByIdAsync(reportId, cancellationToken);
        if (existing is null)
            return ResolveReportResult.Failed(ResolveReportFailure.NotFound, "Không tìm thấy báo cáo.");
        if (existing.Status != ReportStatus.Pending)
            return ResolveReportResult.Failed(ResolveReportFailure.AlreadyResolved, "Báo cáo này đã được xử lý trước đó.");

        var resolved = await reportRepository.ResolvePendingAsync(
            reportId,
            status.Value,
            administratorId,
            timeProvider.GetUtcNow(),
            note,
            cancellationToken);
        if (!resolved)
            return ResolveReportResult.Failed(ResolveReportFailure.AlreadyResolved, "Báo cáo này vừa được quản trị viên khác xử lý.");

        var updated = await reportRepository.GetByIdAsync(reportId, cancellationToken)
            ?? throw new InvalidOperationException("Báo cáo vừa xử lý không còn tồn tại.");
        return ResolveReportResult.Success(MapAdminReport(updated));
    }

    private static AdminReportDto MapAdminReport(ContentReport report)
    {
        var topic = report.Topic ?? report.Answer?.Topic
            ?? throw new InvalidOperationException("Báo cáo thiếu nội dung đích.");
        var targetType = report.TopicId.HasValue ? "topic" : "answer";
        var targetId = report.TopicId ?? report.AnswerId!.Value;
        var bodyHtml = report.Topic?.BodyHtml ?? report.Answer?.BodyHtml
            ?? throw new InvalidOperationException("Báo cáo thiếu nội dung hiển thị.");
        return new AdminReportDto(
            report.Id,
            targetType,
            targetId,
            topic.Title,
            bodyHtml,
            new ReportUserDto(report.Reporter.Id, report.Reporter.DisplayName),
            report.Reason,
            report.Details,
            report.Status.ToString().ToLowerInvariant(),
            report.CreatedAtUtc,
            report.ResolvedBy is null ? null : new ReportUserDto(report.ResolvedBy.Id, report.ResolvedBy.DisplayName),
            report.ResolvedAtUtc,
            report.ResolutionNote);
    }
}
