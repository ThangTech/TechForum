namespace TechForum.Api.Configuration;

public sealed class MediaOptions
{
    public const string SectionName = "Media";

    public string StoragePath { get; init; } = "App_Data/uploads";
    public string RequestPath { get; init; } = "/media";
    public long MaxImageBytes { get; init; } = 5 * 1024 * 1024;
    public long MaxVideoBytes { get; init; } = 50 * 1024 * 1024;
}
