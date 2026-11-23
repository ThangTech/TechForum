using TechForum.Api.Enums;

namespace TechForum.Api.Services;

// Một nơi duy nhất cho quy tắc tính điểm danh tiếng, giống nhau với mọi người.
public static class ReputationRules
{
    // Câu trả lời đáng nhiều điểm hơn bài viết vì đó là công sức giúp người khác.
    public const int AnswerUpvote = 10;
    public const int TopicUpvote = 5;
    public const int Downvote = -2;
    // Người cho phiếu chưa tốt mất điểm để không bình chọn tùy tiện; rút phiếu hoặc đổi thành tốt thì được trả lại.
    public const int DownvoteCost = -1;

    public const int AcceptedAnswer = 15;

    // Ẩn điểm trong vài giờ đầu để người đọc tự đánh giá, không bị dẫn dắt bởi các phiếu đầu tiên.
    // Phiếu vẫn được tính; chỉ điểm hiển thị và thứ tự theo điểm coi như chưa có phiếu.
    public const int ScoreHiddenHours = 2;

    public static bool IsScoreHidden(DateTimeOffset postedAtUtc, DateTimeOffset nowUtc)
    {
        return nowUtc - postedAtUtc < TimeSpan.FromHours(ScoreHiddenHours);
    }

    public static int ShownScore(int score, bool isHidden) => isHidden ? 0 : ForDisplay(score);

    // Không bao giờ hiện số âm, để vài phiếu chưa tốt không kéo người khác hùa theo. DB vẫn giữ số thật (có thể âm),
    // nên rút hoặc đổi phiếu trả lại đúng số điểm.
    public static int ForDisplay(int points) => Math.Max(0, points);

    public static int ForVoter(int value) => value < 0 ? DownvoteCost : 0;

    public static int ForVote(VoteTargetType targetType, int value)
    {
        if (value > 0)
        {
            return targetType == VoteTargetType.Answer ? AnswerUpvote : TopicUpvote;
        }
        if (value < 0)
        {
            return Downvote;
        }

        return 0;
    }
}
