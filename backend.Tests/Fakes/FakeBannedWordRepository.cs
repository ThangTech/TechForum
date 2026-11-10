using TechForum.Api.Data.Repositories;
using TechForum.Api.Models;

namespace TechForum.Api.Tests.Fakes;

// In-memory stand-in for the table of banned words.
public sealed class FakeBannedWordRepository : IBannedWordRepository
{
    private int nextId = 1;

    public List<BannedWord> Items { get; } = [];

    public int AddRangeCalls { get; private set; }

    public Task<IReadOnlyList<BannedWord>> GetAllAsync(CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<BannedWord>>(Items.OrderBy(item => item.Word).ToList());

    public Task<bool> AnyAsync(CancellationToken cancellationToken) => Task.FromResult(Items.Count > 0);

    public Task<BannedWord?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        Task.FromResult(Items.SingleOrDefault(item => item.Id == id));

    public Task<bool> AddAsync(BannedWord word, CancellationToken cancellationToken)
    {
        if (Items.Any(item => string.Equals(item.Word, word.Word, StringComparison.OrdinalIgnoreCase))) return Task.FromResult(false);
        word.Id = TestIds.Id(nextId++);
        Items.Add(word);
        return Task.FromResult(true);
    }

    public Task AddRangeAsync(IReadOnlyList<BannedWord> words, CancellationToken cancellationToken)
    {
        AddRangeCalls++;
        foreach (var word in words)
        {
            word.Id = TestIds.Id(nextId++);
            Items.Add(word);
        }
        return Task.CompletedTask;
    }

    public Task RemoveAsync(BannedWord word, CancellationToken cancellationToken)
    {
        Items.Remove(word);
        return Task.CompletedTask;
    }
}
