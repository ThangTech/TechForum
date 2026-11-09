namespace TechForum.Api.Services;

// Gives the banned words from the database (one list for the whole application).
public interface IBannedWordLoader
{
    Task<IReadOnlyList<string>> LoadAsync(CancellationToken cancellationToken);
}

public interface IProfanityFilter
{
    // Replaces the banned words of the text by "***". isHtml: the text is HTML, so tags and attributes are left alone.
    Task<string> FilterAsync(string text, bool isHtml, CancellationToken cancellationToken);

    // Reads the words from the database into the cache now (called when the application starts and after an admin
    // changes the list).
    Task WarmUpAsync(CancellationToken cancellationToken);

    // Forgets the cached list, so the next text reads it again.
    void Invalidate();
}
