using System.Net;
using System.Text.RegularExpressions;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed partial class AnswerService : IAnswerService
{
    private readonly IAnswerRepository answerRepository;
    private readonly ITopicRepository topicRepository;
    private readonly INotificationService notificationService;
    private readonly IContentSanitizer contentSanitizer;
    private readonly TimeProvider timeProvider;
    private readonly IPostingRateLimiter postingRateLimiter;

    public AnswerService(
        IAnswerRepository answerRepository,
        ITopicRepository topicRepository,
        INotificationService notificationService,
        IContentSanitizer contentSanitizer,
        TimeProvider timeProvider,
        IPostingRateLimiter postingRateLimiter)
    {
        this.answerRepository = answerRepository;
        this.topicRepository = topicRepository;
        this.notificationService = notificationService;
        this.contentSanitizer = contentSanitizer;
        this.timeProvider = timeProvider;
        this.postingRateLimiter = postingRateLimiter;
    }

    public async Task<PagedResultDto<AnswerDto>?> GetPublicPageAsync(
        Guid topicId,
        AnswerQuery query,
        CancellationToken cancellationToken,
        string? viewerId = null)
    {
        var topic = await topicRepository.GetPublicByIdAsync(topicId, cancellationToken);
        if (topic is null)
        {
            return null;
        }

        var page = await answerRepository.GetPublicPageAsync(
            topicId,
            query.Page,
            query.PageSize,
            query.AroundAnswerId,
            query.Sort,
            cancellationToken);
        if (page is null)
        {
            return null;
        }
        var voteStates = page.Items.Count == 0
            ? new Dictionary<Guid, AnswerVoteState>()
            : (await answerRepository.GetVoteStatesAsync(
                page.Items.Select(answer => answer.Id).ToArray(), viewerId, cancellationToken))
                .ToDictionary(state => state.AnswerId);
        var totalPages = page.TotalItems == 0
            ? 0
            : (int)Math.Ceiling(page.TotalItems / (double)query.PageSize);

        return new PagedResultDto<AnswerDto>(
            page.Items.Select(answer => MapAnswer(
                answer, AcceptedAnswerIdFor(topic), voteState: voteStates.GetValueOrDefault(answer.Id))).ToList(),
            page.Page,
            query.PageSize,
            page.TotalItems,
            totalPages);
    }

    public async Task<Result<AnswerDto>> CreateAsync(
        Guid topicId,
        string authorId,
        CreateAnswerRequest request,
        CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetPublicByIdAsync(topicId, cancellationToken);
        if (topic is null)
        {
            return Result<AnswerDto>.Fail(ErrorType.NotFound, "Không tìm thấy chủ đề", "Chủ đề không tồn tại hoặc không còn công khai.");
        }

        if (topic.IsDiscussionLocked)
        {
            return Result<AnswerDto>.Fail(ErrorType.Conflict, "Thảo luận đã bị khóa", "Chủ đề đã khóa thảo luận.");
        }

        if (request.BodyHtml is null || request.BodyHtml.Length > MaxBodyHtmlLength || TextLength(request.BodyHtml) > MaxTextLength)
        {
            return Result<AnswerDto>.Fail(ErrorType.Validation, "Câu trả lời gửi lên chưa hợp lệ", "Câu trả lời không được để trống hoặc vượt quá 20.000 ký tự.",
                "bodyHtml");
        }

        var sanitizedBody = contentSanitizer.Sanitize(request.BodyHtml).Trim();
        if (!HasMeaningfulContent(sanitizedBody))
        {
            return Result<AnswerDto>.Fail(ErrorType.Validation, "Câu trả lời gửi lên chưa hợp lệ", "Câu trả lời phải có nội dung văn bản hợp lệ.",
                "bodyHtml");
        }

        Answer? parentAnswer = null;
        if (request.ParentAnswerId is not null)
        {
            parentAnswer = await answerRepository.GetVisibleByIdAsync(
                topicId, request.ParentAnswerId.Value, cancellationToken);
            if (parentAnswer is null)
            {
                return Result<AnswerDto>.Fail(ErrorType.Validation, "Câu trả lời gửi lên chưa hợp lệ", "Phản hồi bạn đang trả lời không còn tồn tại.",
                    "parentAnswerId");
            }

            if (parentAnswer.ParentAnswerId is not null)
            {
                parentAnswer = await answerRepository.GetVisibleByIdAsync(
                    topicId, parentAnswer.ParentAnswerId.Value, cancellationToken);
            }
        }

        // Chỉ đếm khi câu trả lời đã hợp lệ và sắp được lưu.
        if (!postingRateLimiter.TryAcquireAnswer(authorId, out var retryAfter))
        {
            var seconds = MemberRateLimit.ToSeconds(retryAfter);
            return Result<AnswerDto>.TooManyRequests(
                "Bạn trả lời quá nhanh", $"Vui lòng chờ {MemberRateLimit.FormatWait(seconds)} rồi gửi câu trả lời tiếp.", seconds);
        }

        var answer = new Answer
        {
            TopicId = topicId,
            ParentAnswerId = parentAnswer?.Id,
            AuthorId = authorId,
            BodyHtml = sanitizedBody,
            CreatedAtUtc = timeProvider.GetUtcNow()
        };

        await answerRepository.AddAsync(answer, cancellationToken);
        var notificationRecipientId = parentAnswer?.AuthorId ?? topic.AuthorId;
        if (notificationRecipientId != authorId)
        {
            await notificationService.AddNewAnswerAsync(
                notificationRecipientId,
                topic.Id,
                answer.Id,
                answer.Author.DisplayName,
                topic.Title,
                cancellationToken);
        }
        var replyingTo = parentAnswer is null
            ? null
            : new TopicAuthorDto(parentAnswer.Author.Id, parentAnswer.Author.DisplayName);
        return Result<AnswerDto>.Success(MapAnswer(answer, AcceptedAnswerIdFor(topic), replyingTo));
    }

    public async Task<Result<AnswerDto>> AcceptAsync(
        Guid topicId,
        Guid answerId,
        string authorId,
        CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetOwnedByIdAsync(topicId, authorId, cancellationToken);
        if (topic is null ||
            topic.Status != TopicStatus.Published ||
            topic.PublishedAtUtc is null ||
            topic.IsHiddenByModerator)
        {
            return Result<AnswerDto>.Fail(ErrorType.NotFound, "Không thể chọn câu trả lời", "Chủ đề hoặc câu trả lời không tồn tại, không công khai hoặc không thuộc quyền quản lý của bạn.");
        }

        if (topic.Type != TopicType.Question)
        {
            return Result<AnswerDto>.Fail(ErrorType.Conflict, "Chỉ câu hỏi mới có câu trả lời được chấp nhận");
        }

        var answer = await answerRepository.GetVisibleByIdAsync(
            topicId,
            answerId,
            cancellationToken);
        if (answer is null)
        {
            return Result<AnswerDto>.Fail(ErrorType.NotFound, "Không thể chọn câu trả lời", "Chủ đề hoặc câu trả lời không tồn tại, không công khai hoặc không thuộc quyền quản lý của bạn.");
        }

        if (answer.ParentAnswerId is not null)
        {
            return Result<AnswerDto>.Fail(ErrorType.NotFound, "Không thể chọn câu trả lời", "Chủ đề hoặc câu trả lời không tồn tại, không công khai hoặc không thuộc quyền quản lý của bạn.");
        }

        var previousAcceptedId = topic.AcceptedAnswerId;
        topic.AcceptedAnswerId = answer.Id;
        if (answer.AuthorId != authorId)
        {
            await notificationService.AddAcceptedAnswerAsync(
                answer.AuthorId,
                topic.Id,
                answer.Id,
                topic.Title,
                cancellationToken);
        }
        await topicRepository.SaveChangesAsync(cancellationToken);
        await MoveAcceptedBonusAsync(topicId, previousAcceptedId, answer, authorId, cancellationToken);

        var voteState = await GetVoteStateAsync(answer.Id, authorId, cancellationToken);
        return Result<AnswerDto>.Success(MapAnswer(answer, answer.Id, voteState: voteState));
    }

    public async Task<Result<AnswerDto>> UpdateAsync(
        Guid topicId,
        Guid answerId,
        string authorId,
        CreateAnswerRequest request,
        CancellationToken cancellationToken)
    {
        var answer = await answerRepository.GetOwnedByIdAsync(
            topicId, answerId, authorId, cancellationToken);
        if (answer is null)
        {
            return Result<AnswerDto>.Fail(ErrorType.NotFound, "Không tìm thấy câu trả lời", "Không tìm thấy câu trả lời thuộc tài khoản của bạn.");
        }

        if (request.BodyHtml is null || request.BodyHtml.Length > MaxBodyHtmlLength || TextLength(request.BodyHtml) > MaxTextLength)
        {
            return Result<AnswerDto>.Fail(ErrorType.Validation, null, "Câu trả lời không được để trống hoặc vượt quá 20.000 ký tự.", "bodyHtml");
        }
        var sanitizedBody = contentSanitizer.Sanitize(request.BodyHtml).Trim();
        if (!HasMeaningfulContent(sanitizedBody))
        {
            return Result<AnswerDto>.Fail(ErrorType.Validation, null, "Câu trả lời phải có nội dung văn bản hợp lệ.", "bodyHtml");
        }

        answer.BodyHtml = sanitizedBody;
        answer.UpdatedAtUtc = timeProvider.GetUtcNow();
        await answerRepository.SaveChangesAsync(cancellationToken);
        var voteState = await GetVoteStateAsync(answer.Id, authorId, cancellationToken);
        return Result<AnswerDto>.Success(MapAnswer(
            answer, AcceptedAnswerIdFor(answer.Topic), voteState: voteState));
    }

    public async Task<Result> DeleteAsync(
        Guid topicId,
        Guid answerId,
        string authorId,
        CancellationToken cancellationToken)
    {
        var answer = await answerRepository.GetOwnedByIdAsync(
            topicId, answerId, authorId, cancellationToken);
        if (answer is null)
        {
            return Result.Fail(ErrorType.NotFound, "Không tìm thấy câu trả lời", "Câu trả lời không tồn tại hoặc không thuộc tài khoản của bạn.");
        }
        answer.IsDeleted = true;
        answer.UpdatedAtUtc = timeProvider.GetUtcNow();
        var wasAccepted = answer.Topic.AcceptedAnswerId == answer.Id;
        if (wasAccepted)
        {
            answer.Topic.AcceptedAnswerId = null;
        }
        await answerRepository.SaveChangesAsync(cancellationToken);
        // Xóa câu trả lời được chấp nhận thì tác giả mất điểm thưởng.
        if (wasAccepted && answer.AuthorId != answer.Topic.AuthorId)
        {
            await answerRepository.AdjustReputationAsync(answer.AuthorId, -ReputationRules.AcceptedAnswer, cancellationToken);
        }
        return Result.Success();
    }

    // Tác giả câu trả lời mới được chọn nhận thưởng, tác giả câu được chọn trước đó mất thưởng.
    // Tự chọn câu trả lời của mình thì không ai được điểm.
    private async Task MoveAcceptedBonusAsync(
        Guid topicId,
        Guid? previousAcceptedId,
        Answer accepted,
        string topicAuthorId,
        CancellationToken cancellationToken)
    {
        if (previousAcceptedId == accepted.Id) return;

        if (accepted.AuthorId != topicAuthorId)
        {
            await answerRepository.AdjustReputationAsync(accepted.AuthorId, ReputationRules.AcceptedAnswer, cancellationToken);
        }
        if (previousAcceptedId.HasValue)
        {
            var previous = await answerRepository.GetVisibleByIdAsync(topicId, previousAcceptedId.Value, cancellationToken);
            if (previous is not null && previous.AuthorId != topicAuthorId)
            {
                await answerRepository.AdjustReputationAsync(previous.AuthorId, -ReputationRules.AcceptedAnswer, cancellationToken);
            }
        }
    }

    private static Guid? AcceptedAnswerIdFor(Topic topic)
    {
        return topic.Type == TopicType.Question ? topic.AcceptedAnswerId : null;
    }

    private async Task<AnswerVoteState?> GetVoteStateAsync(
        Guid answerId,
        string viewerId,
        CancellationToken cancellationToken)
    {
        var states = await answerRepository.GetVoteStatesAsync([answerId], viewerId, cancellationToken);
        return states.FirstOrDefault();
    }

    private AnswerDto MapAnswer(
        Answer answer,
        Guid? acceptedAnswerId,
        TopicAuthorDto? replyingTo = null,
        AnswerVoteState? voteState = null)
    {
        return new(
            answer.Id,
            answer.TopicId,
            answer.ParentAnswerId,
            replyingTo ?? (answer.ParentAnswer is null
                ? null
                : new TopicAuthorDto(answer.ParentAnswer.Author.Id, answer.ParentAnswer.Author.DisplayName)),
            answer.BodyHtml,
            new TopicAuthorDto(answer.Author.Id, answer.Author.DisplayName),
            answer.CreatedAtUtc,
            answer.UpdatedAtUtc,
            answer.Id == acceptedAnswerId,
            ReputationRules.ShownScore(voteState?.Score ?? answer.Score, ReputationRules.IsScoreHidden(answer.CreatedAtUtc, timeProvider.GetUtcNow())),
            voteState?.MyVote ?? 0,
            ReputationRules.IsScoreHidden(answer.CreatedAtUtc, timeProvider.GetUtcNow()));
    }

    // Giới hạn 20.000 ký tự tính trên chữ người dùng gõ; thẻ HTML của định dạng (đậm, code, danh sách) được thêm chỗ.
    private const int MaxTextLength = 20_000;
    private const int MaxBodyHtmlLength = 50_000;

    private static int TextLength(string html)
    {
        return WebUtility.HtmlDecode(HtmlTag().Replace(html, string.Empty)).Length;
    }

    private static bool HasMeaningfulContent(string html)
    {
        var text = HtmlTag().Replace(html, " ");
        return !string.IsNullOrWhiteSpace(WebUtility.HtmlDecode(text));
    }

    [GeneratedRegex("<[^>]+>", RegexOptions.CultureInvariant)]
    private static partial Regex HtmlTag();
}
