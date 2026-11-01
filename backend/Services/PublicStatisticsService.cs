using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public sealed class PublicStatisticsService(IPublicStatisticsRepository repository) : IPublicStatisticsService
{
    public async Task<PublicStatisticsDto> GetAsync(CancellationToken cancellationToken)
    {
        var data = await repository.GetAsync(cancellationToken);
        return new PublicStatisticsDto(data.MemberCount, data.ArticleCount, data.QuestionCount);
    }
}
