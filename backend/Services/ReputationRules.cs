using TechForum.Api.Enums;

namespace TechForum.Api.Services;

// How many reputation points the author of a post or an answer gets. They are the same rules for everybody, in one place.
public static class ReputationRules
{
    // An upvote of an answer is worth more than an upvote of a post: an answer is the work that helps somebody.
    public const int AnswerUpvote = 10;
    public const int TopicUpvote = 5;
    // A downvote takes points away, for a post and for an answer.
    public const int Downvote = -2;
    // The member who gives a downvote pays this much reputation for it, so a downvote is not given without thinking. The
    // points come back when the member takes the vote back or changes it to an upvote.
    public const int DownvoteCost = -1;

    // The author of a question chose this answer as the right one.
    public const int AcceptedAnswer = 15;

    // The score of a post or answer is hidden for this many hours after it is posted, so people judge it on its own and are
    // not carried by the first votes. Votes are still counted; the score and the order by score are the same as if there
    // were none until the time has passed.
    public const int ScoreHiddenHours = 2;

    public static bool IsScoreHidden(DateTimeOffset postedAtUtc, DateTimeOffset nowUtc) =>
        nowUtc - postedAtUtc < TimeSpan.FromHours(ScoreHiddenHours);

    // The score as it is shown: 0 while it is hidden, never below 0 otherwise.
    public static int ShownScore(int score, bool isHidden) => isHidden ? 0 : ForDisplay(score);

    // What a member sees. The score of a post or answer and the reputation of a member are never shown below 0: a few
    // downvotes must not show a negative number or invite others to pile on. The database keeps the real number (it can be
    // below 0), so taking a vote back or changing it still gives the points back exactly.
    public static int ForDisplay(int points) => Math.Max(0, points);

    // The points that a vote of this value costs the member who gives it (only a downvote costs).
    public static int ForVoter(int value) => value < 0 ? DownvoteCost : 0;

    // The points that a vote of this value (+1, -1 or 0 for no vote) gives to the author.
    public static int ForVote(VoteTargetType targetType, int value) => value switch
    {
        > 0 => targetType == VoteTargetType.Answer ? AnswerUpvote : TopicUpvote,
        < 0 => Downvote,
        _ => 0
    };
}
