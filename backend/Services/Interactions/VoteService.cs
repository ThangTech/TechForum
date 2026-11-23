using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;

namespace TechForum.Api.Services;

public sealed class VoteService : IVoteService
{
    public const string AccountTooNewTitle = "Tài khoản chưa đủ lâu để bình chọn";
    public const string DownvoteNotAllowedTitle = "Chưa thể bình chọn chưa tốt";

    private readonly ITopicRepository topicRepository;
    private readonly IAnswerRepository answerRepository;
    private readonly IVoteRepository voteRepository;
    private readonly IAccountRepository accountRepository;
    private readonly IVoteRateLimiter rateLimiter;
    private readonly IOptions<VoteLimitOptions> limitOptions;
    private readonly TimeProvider timeProvider;

    public VoteService(
        ITopicRepository topicRepository,
        IAnswerRepository answerRepository,
        IVoteRepository voteRepository,
        IAccountRepository accountRepository,
        IVoteRateLimiter rateLimiter,
        IOptions<VoteLimitOptions> limitOptions,
        TimeProvider timeProvider)
    {
        this.topicRepository = topicRepository;
        this.answerRepository = answerRepository;
        this.voteRepository = voteRepository;
        this.accountRepository = accountRepository;
        this.rateLimiter = rateLimiter;
        this.limitOptions = limitOptions;
        this.timeProvider = timeProvider;
    }

    public async Task<VoteDto?> GetTopicVoteAsync(Guid topicId, string? viewerId, CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetPublicByIdAsync(topicId, cancellationToken);
        if (topic is null) return null;

        var myVote = string.IsNullOrWhiteSpace(viewerId)
            ? 0
            : await voteRepository.GetMyVoteAsync(viewerId, VoteTargetType.Topic, topicId, cancellationToken);
        var isHidden = IsHidden(topic.PublishedAtUtc);
        return new VoteDto(ReputationRules.ShownScore(topic.Score, isHidden), myVote, isHidden);
    }

    public async Task<Result<VoteDto>> SetTopicVoteAsync(Guid topicId, string userId, int value, CancellationToken cancellationToken)
    {
        var refused = CheckValueAndSpeed(userId, value);
        if (refused is not null) return refused;

        var topic = await topicRepository.GetPublicByIdAsync(topicId, cancellationToken);
        if (topic is null) return NotFound();
        if (topic.AuthorId == userId) return OwnContent();
        var tooNew = await CheckAccountAgeAsync(userId, value, cancellationToken);
        if (tooNew is not null) return tooNew;

        return await ApplyAsync(userId, VoteTargetType.Topic, topicId, topic.AuthorId, value, topic.PublishedAtUtc, cancellationToken);
    }

    public async Task<Result<VoteDto>> SetAnswerVoteAsync(
        Guid topicId,
        Guid answerId,
        string userId,
        int value,
        CancellationToken cancellationToken)
    {
        var refused = CheckValueAndSpeed(userId, value);
        if (refused is not null) return refused;

        // Câu trả lời phải công khai và nằm trong bài công khai.
        var topic = await topicRepository.GetPublicByIdAsync(topicId, cancellationToken);
        if (topic is null) return NotFound();
        var answer = await answerRepository.GetVisibleByIdAsync(topicId, answerId, cancellationToken);
        if (answer is null) return NotFound();
        if (answer.AuthorId == userId) return OwnContent();
        var tooNew = await CheckAccountAgeAsync(userId, value, cancellationToken);
        if (tooNew is not null) return tooNew;

        return await ApplyAsync(userId, VoteTargetType.Answer, answerId, answer.AuthorId, value, answer.CreatedAtUtc, cancellationToken);
    }

    private static Result<VoteDto> NotFound()
    {
        return Result<VoteDto>.Fail(ErrorType.NotFound, "Không tìm thấy nội dung");
    }

    private static Result<VoteDto> OwnContent()
    {
        return Result<VoteDto>.Fail(ErrorType.Conflict, "Bạn không thể bình chọn nội dung của chính mình");
    }

    // Kiểm tra không cần DB trước. Yêu cầu bị từ chối vì giá trị sai thì không tốn lượt của giới hạn.
    private Result<VoteDto>? CheckValueAndSpeed(string userId, int value)
    {
        if (value < -1 || value > 1)
        {
            return Result<VoteDto>.Fail(ErrorType.Validation, "Giá trị bình chọn chưa hợp lệ", "Giá trị bình chọn phải là 1, -1 hoặc 0.", "value");
        }

        if (!rateLimiter.TryAcquire(userId, out var retryAfter))
        {
            var seconds = MemberRateLimit.ToSeconds(retryAfter);
            // Chờ từ một giờ trở lên nghĩa là đã hết lượt của cả ngày.
            var message = seconds >= 3600
                ? $"Bạn đã dùng hết số lượt bình chọn trong ngày. Vui lòng thử lại sau {MemberRateLimit.FormatWait(seconds)}."
                : $"Bạn đã bình chọn quá nhiều trong thời gian ngắn. Vui lòng thử lại sau {MemberRateLimit.FormatWait(seconds)}.";
            return Result<VoteDto>.TooManyRequests("Bạn bình chọn quá nhanh", message, seconds);
        }
        return null;
    }

    // Tài khoản mới không bình chọn được; phiếu chưa tốt cần tài khoản đủ ngày hoặc đủ danh tiếng. Rút phiếu (0) luôn được.
    private async Task<Result<VoteDto>?> CheckAccountAgeAsync(string userId, int value, CancellationToken cancellationToken)
    {
        if (value == 0) return null;

        var limits = limitOptions.Value;
        var user = await accountRepository.FindByIdAsync(userId);
        if (user is null) return NotFound();

        var age = timeProvider.GetUtcNow() - user.CreatedAtUtc;
        var minimumAge = TimeSpan.FromDays(limits.MinAccountAgeDays);
        if (age < minimumAge)
        {
            var daysLeft = (int)Math.Ceiling((minimumAge - age).TotalDays);
            return Result<VoteDto>.Fail(ErrorType.Forbidden, AccountTooNewTitle,
                $"Tài khoản cần được tạo ít nhất vài ngày mới được bình chọn. Bạn có thể bình chọn sau khoảng {daysLeft} ngày nữa.");
        }

        if (value < 0)
        {
            var downvoteAge = TimeSpan.FromDays(limits.DownvoteMinAccountAgeDays);
            // Dùng danh tiếng thật (số hiển thị không bao giờ âm, số thật thì có thể).
            if (age < downvoteAge && user.Reputation < limits.DownvoteMinReputation)
            {
                var daysLeft = (int)Math.Ceiling((downvoteAge - age).TotalDays);
                var reputationLeft = limits.DownvoteMinReputation - Math.Max(0, user.Reputation);
                return Result<VoteDto>.Fail(ErrorType.Forbidden, DownvoteNotAllowedTitle,
                    $"Để bình chọn chưa tốt, tài khoản cần tồn tại ít nhất {limits.DownvoteMinAccountAgeDays} ngày hoặc có từ {limits.DownvoteMinReputation} điểm danh tiếng. " +
                    $"Bạn còn khoảng {daysLeft} ngày nữa, hoặc cần thêm {reputationLeft} điểm danh tiếng.");
            }
        }
        return null;
    }

    private async Task<Result<VoteDto>> ApplyAsync(
        string userId,
        VoteTargetType targetType,
        Guid targetId,
        string authorId,
        int value,
        DateTimeOffset? postedAtUtc,
        CancellationToken cancellationToken)
    {
        var outcome = await voteRepository.ApplyAsync(
            new VoteCommand(userId, targetType, targetId, authorId, value, timeProvider.GetUtcNow()),
            cancellationToken);
        var isHidden = IsHidden(postedAtUtc);
        return Result<VoteDto>.Success(new VoteDto(ReputationRules.ShownScore(outcome.Score, isHidden), outcome.NewValue, isHidden));
    }

    private bool IsHidden(DateTimeOffset? postedAtUtc)
    {
        return postedAtUtc.HasValue && ReputationRules.IsScoreHidden(postedAtUtc.Value, timeProvider.GetUtcNow());
    }
}
