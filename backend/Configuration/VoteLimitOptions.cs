namespace TechForum.Api.Configuration;

// The limits that keep the votes honest (section "VoteLimits" of the configuration).
public sealed class VoteLimitOptions
{
    public const string SectionName = "VoteLimits";

    // A member can vote only when the account is at least this many days old, so an account made on purpose to
    // push or drag down a score cannot vote at once.
    public int MinAccountAgeDays { get; init; } = 3;

    // A downvote is harder to get than an upvote, because it is the vote that is used to hurt: the account must be at least
    // this many days old OR have at least this much reputation (a member who has earned the trust of others may downvote
    // sooner). This is on top of MinAccountAgeDays.
    public int DownvoteMinAccountAgeDays { get; init; } = 7;
    public int DownvoteMinReputation { get; init; } = 50;

    // The most votes (also taking a vote back) that one member can send in a minute and in a day.
    public int PerMinute { get; init; } = 30;
    public int PerDay { get; init; } = 200;
}
