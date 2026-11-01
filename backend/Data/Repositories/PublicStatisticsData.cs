namespace TechForum.Api.Data.Repositories;

public sealed record PublicStatisticsData(
    int MemberCount,
    int ArticleCount,
    int QuestionCount);
