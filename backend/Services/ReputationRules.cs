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
    // The author of a question chose this answer as the right one.
    public const int AcceptedAnswer = 15;

    // What a member sees. The score of a post or answer and the reputation of a member are never shown below 0: a few
    // downvotes must not show a negative number or invite others to pile on. The database keeps the real number (it can be
    // below 0), so taking a vote back or changing it still gives the points back exactly.
    public static int ForDisplay(int points) => Math.Max(0, points);

    // The points that a vote of this value (+1, -1 or 0 for no vote) gives to the author.
    public static int ForVote(VoteTargetType targetType, int value) => value switch
    {
        > 0 => targetType == VoteTargetType.Answer ? AnswerUpvote : TopicUpvote,
        < 0 => Downvote,
        _ => 0
    };
}
