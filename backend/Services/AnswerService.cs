using System.Net;
using System.Text.RegularExpressions;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed partial class AnswerService(
    IAnswerRepository answerRepository,
    ITopicRepository topicRepository,
    IContentSanitizer contentSanitizer,
    TimeProvider timeProvider) : IAnswerService
{
    public async Task<PagedResultDto<AnswerDto>?> GetPublicPageAsync(
        int topicId,
        AnswerQuery query,
        CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetPublicByIdAsync(topicId, cancellationToken);
        if (topic is null) return null;

        var page = await answerRepository.GetPublicPageAsync(
            topicId,
            query.Page,
            query.PageSize,
            cancellationToken);
        var totalPages = page.TotalItems == 0
            ? 0
            : (int)Math.Ceiling(page.TotalItems / (double)query.PageSize);

        return new PagedResultDto<AnswerDto>(
            page.Items.Select(answer => MapAnswer(answer, topic.AcceptedAnswerId)).ToList(),
            query.Page,
            query.PageSize,
            page.TotalItems,
            totalPages);
    }

    public async Task<CreateAnswerResult> CreateAsync(
        int topicId,
        string authorId,
        CreateAnswerRequest request,
        CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetPublicByIdAsync(topicId, cancellationToken);
        if (topic is null)
        {
            return CreateAnswerResult.Failed(
                CreateAnswerFailure.TopicNotFound,
                "Chủ đề không tồn tại hoặc không còn công khai.");
        }

        if (topic.IsDiscussionLocked)
        {
            return CreateAnswerResult.Failed(
                CreateAnswerFailure.DiscussionLocked,
                "Chủ đề đã khóa thảo luận.");
        }

        if (request.BodyHtml is null || request.BodyHtml.Length > 20_000)
        {
            return CreateAnswerResult.Failed(
                CreateAnswerFailure.Validation,
                "Câu trả lời không được để trống hoặc vượt quá 20.000 ký tự.",
                "bodyHtml");
        }

        var sanitizedBody = contentSanitizer.Sanitize(request.BodyHtml).Trim();
        if (!HasMeaningfulContent(sanitizedBody))
        {
            return CreateAnswerResult.Failed(
                CreateAnswerFailure.Validation,
                "Câu trả lời phải có nội dung văn bản hợp lệ.",
                "bodyHtml");
        }

        var answer = new Answer
        {
            TopicId = topicId,
            AuthorId = authorId,
            BodyHtml = sanitizedBody,
            CreatedAtUtc = timeProvider.GetUtcNow()
        };

        await answerRepository.AddAsync(answer, cancellationToken);
        return CreateAnswerResult.Success(MapAnswer(answer, topic.AcceptedAnswerId));
    }

    public async Task<AcceptAnswerResult> AcceptAsync(
        int topicId,
        int answerId,
        string authorId,
        CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetOwnedByIdAsync(topicId, authorId, cancellationToken);
        if (topic is null ||
            topic.Status != TopicStatus.Published ||
            topic.IsHiddenByModerator)
        {
            return AcceptAnswerResult.Failed(AcceptAnswerFailure.NotFound);
        }

        if (topic.Type != TopicType.Question)
        {
            return AcceptAnswerResult.Failed(AcceptAnswerFailure.NotQuestion);
        }

        var answer = await answerRepository.GetVisibleByIdAsync(
            topicId,
            answerId,
            cancellationToken);
        if (answer is null)
        {
            return AcceptAnswerResult.Failed(AcceptAnswerFailure.NotFound);
        }

        topic.AcceptedAnswerId = answer.Id;
        await topicRepository.SaveChangesAsync(cancellationToken);

        return AcceptAnswerResult.Success(MapAnswer(answer, answer.Id));
    }

    private static AnswerDto MapAnswer(Answer answer, int? acceptedAnswerId) => new(
        answer.Id,
        answer.TopicId,
        answer.BodyHtml,
        new TopicAuthorDto(answer.Author.Id, answer.Author.DisplayName),
        answer.CreatedAtUtc,
        answer.UpdatedAtUtc,
        answer.Id == acceptedAnswerId);

    private static bool HasMeaningfulContent(string html)
    {
        var text = HtmlTag().Replace(html, " ");
        return !string.IsNullOrWhiteSpace(WebUtility.HtmlDecode(text));
    }

    [GeneratedRegex("<[^>]+>", RegexOptions.CultureInvariant)]
    private static partial Regex HtmlTag();
}
