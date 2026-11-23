using TechForum.Api.Data.Repositories;

namespace TechForum.Api.Services;

// Cache sống cùng ứng dụng nhưng repository cần một scope (vì dùng DbContext).
public sealed class BannedWordLoader : IBannedWordLoader
{
    private readonly IServiceScopeFactory scopeFactory;

    public BannedWordLoader(IServiceScopeFactory scopeFactory)
    {
        this.scopeFactory = scopeFactory;
    }

    public async Task<IReadOnlyList<string>> LoadAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var repository = scope.ServiceProvider.GetRequiredService<IBannedWordRepository>();
        return (await repository.GetAllAsync(cancellationToken)).Select(item => item.Word).ToList();
    }
}
