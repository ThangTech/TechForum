namespace TechForum.Api.Configuration;

// When reported content hides itself before a moderator looks at it (section "Reports" of the configuration).
public sealed class ReportLimitOptions
{
    public const string SectionName = "Reports";

    // The content is hidden when this many different members have a report waiting on it.
    public int AutoHideThreshold { get; init; } = 5;

    // Only the reports of accounts at least this many days old are counted, so a few accounts made on purpose cannot
    // hide the content of somebody else.
    public int MinReporterAccountAgeDays { get; init; } = 3;
}
