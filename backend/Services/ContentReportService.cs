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
}
