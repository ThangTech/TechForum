namespace TechForum.Api.Services;

// Fills an empty table of banned words from the lines of the local list file.
public interface IBannedWordSeeder
{
    // Returns the number of words added. Nothing is added when the table already has words (an admin may have deleted
    // some on purpose, and they must not come back), or when the lines hold no allowed word.
    Task<int> SeedIfEmptyAsync(IEnumerable<string> lines, CancellationToken cancellationToken);
}
