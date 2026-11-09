using TechForum.Api.Data.Repositories;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class BannedWordSeeder(
    IBannedWordRepository repository,
    TimeProvider timeProvider,
    ILogger<BannedWordSeeder> logger) : IBannedWordSeeder
{
    public async Task<int> SeedIfEmptyAsync(IEnumerable<string> lines, CancellationToken cancellationToken)
    {
        var words = BannedWordRules.ParseLines(lines);
        if (words.Count == 0 || await repository.AnyAsync(cancellationToken)) return 0;

        var now = timeProvider.GetUtcNow();
        await repository.AddRangeAsync(
            words.Select(word => new BannedWord { Word = word, CreatedAtUtc = now }).ToList(),
            cancellationToken);
        logger.LogInformation("Đã nạp {Count} từ cấm từ file danh sách vào bảng BannedWords.", words.Count);
        return words.Count;
    }
}
