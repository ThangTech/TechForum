using TechForum.Api.Enums;

namespace TechForum.Api.Data.Repositories;

public sealed record VoteCommand(
    string VoterId,
    VoteTargetType TargetType,
    Guid TargetId,
    string AuthorId,
    int NewValue,
    DateTimeOffset NowUtc);

public sealed record VoteOutcome(int PreviousValue, int NewValue, int Score);

public interface IVoteRepository
{
    // Lưu phiếu, đổi điểm của bài hoặc câu trả lời, danh tiếng của tác giả và (với phiếu chưa tốt) của người bình chọn.
    // Tất cả trong một giao dịch: một bước lỗi thì không bước nào được giữ.
    Task<VoteOutcome> ApplyAsync(VoteCommand command, CancellationToken cancellationToken);

    Task<int> GetMyVoteAsync(string userId, VoteTargetType targetType, Guid targetId, CancellationToken cancellationToken);
}
