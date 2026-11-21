using TechForum.Api.Data.Repositories;

namespace TechForum.Api.Services;

// The cache lives as long as the application, but the repository needs a scope (it uses the DbContext).
public sealed class BannedWordLoader(IServiceScopeFactory scopeFactory) : IBannedWordLoader
{
    public async Task<IReadOnlyList<string>> LoadAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var repository = scope.ServiceProvider.GetRequiredService<IBannedWordRepository>();
        return (await repository.GetAllAsync(cancellationToken)).Select(item => item.Word).ToList();
    }
}
