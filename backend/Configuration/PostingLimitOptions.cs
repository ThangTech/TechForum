namespace TechForum.Api.Configuration;

// How fast one member can publish (section "PostingLimits" of the configuration), so a script cannot fill the forum.
// Only content that passed the checks is counted: a member who fixes a mistake in the form is not made to wait.
public sealed class PostingLimitOptions
{
    public const string SectionName = "PostingLimits";

    // One topic published in this many seconds.
    public int TopicIntervalSeconds { get; init; } = 30;

    // The most answers and replies in one minute. Higher than for topics, because a discussion goes back and forth.
    public int AnswersPerMinute { get; init; } = 5;
}
