using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public sealed class PublicStatisticsService : IPublicStatisticsService
{
    private readonly IPublicStatisticsRepository repository;

    public PublicStatisticsService(IPublicStatisticsRepository repository)
    {
        this.repository = repository;
    }

    public async Task<PublicStatisticsDto> GetAsync(CancellationToken cancellationToken)
    {
        var data = await repository.GetAsync(cancellationToken);
        return new PublicStatisticsDto(data.MemberCount, data.ArticleCount, data.QuestionCount);
    }
}
