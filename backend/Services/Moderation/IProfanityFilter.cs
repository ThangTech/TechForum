namespace TechForum.Api.Services;

public interface IBannedWordLoader
{
    Task<IReadOnlyList<string>> LoadAsync(CancellationToken cancellationToken);
}

public interface IProfanityFilter
{
    // isHtml: văn bản là HTML nên không đụng tới thẻ và thuộc tính.
    Task<string> FilterAsync(string text, bool isHtml, CancellationToken cancellationToken);

    // Gọi khi khởi động và sau khi quản trị viên đổi danh sách.
    Task WarmUpAsync(CancellationToken cancellationToken);

    void Invalidate();
}
