namespace TechForum.Api.Dtos;

public sealed record PublicStatisticsDto(
    int MemberCount,
    int ArticleCount,
    int QuestionCount);
