using TechForum.Api.Services;
using TechForum.Api.Tests.Fakes;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class ContentSanitizerTests
{
    private readonly ContentSanitizer sanitizer = TestMediaRules.CreateSanitizer();

    [Fact]
    public void Sanitize_RemovesScriptsEventHandlersAndUnsafeSchemes()
    {
        const string html = """
            <script>alert('xss')</script>
            <p onclick="alert('xss')">Nội dung</p>
            <a href="javascript:alert('xss')">Liên kết xấu</a>
            <img src="data:text/html;base64,PHNjcmlwdD4=" onerror="alert('xss')">
            """;

        var result = sanitizer.Sanitize(html);

        Assert.DoesNotContain("<script", result, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("onclick", result, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("javascript:", result, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("data:", result, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("onerror", result, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Nội dung", result);
    }

    [Fact]
    public void Sanitize_PreservesInternalMediaAndRejectsExternalMediaUrls()
    {
        const string html = """
            <h2>Tiêu đề</h2>
            <pre><code class="language-csharp">var answer = 42;</code></pre>
            <img src="/media/images/0123456789abcdef0123456789abcdef.png" alt="Mô tả">
            <video controls preload="metadata" playsinline src="/media/videos/0123456789abcdef0123456789abcdef.mp4"></video>
            <img src="https://evil.example/image.png" alt="Ảnh ngoài">
            """;

        var result = sanitizer.Sanitize(html);

        Assert.Contains("<h2>Tiêu đề</h2>", result);
        Assert.Contains("<code class=\"language-csharp\">", result);
        Assert.Contains("/media/images/0123456789abcdef0123456789abcdef.png", result);
        Assert.Contains("/media/videos/0123456789abcdef0123456789abcdef.mp4", result);
        Assert.Contains("controls", result);
        Assert.Contains("preload=\"metadata\"", result);
        Assert.Contains("playsinline", result);
        Assert.DoesNotContain("https://evil.example", result, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Sanitize_KeepsPicturesAndVideosOfOurCloudinaryAccountAndDropsThoseOfOthers()
    {
        const string ours = "https://res.cloudinary.com/demo-cloud/image/upload/v1699999999/techforum/images/0123456789abcdef0123456789abcdef.png";
        const string video = "https://res.cloudinary.com/demo-cloud/video/upload/v1699999999/techforum/videos/0123456789abcdef0123456789abcdef.mp4";
        const string foreign = "https://res.cloudinary.com/other-cloud/image/upload/v1/techforum/images/0123456789abcdef0123456789abcdef.png";
        var html = $"<img src=\"{ours}\" alt=\"a\"><video controls src=\"{video}\"></video><img src=\"{foreign}\" alt=\"b\">";

        var result = sanitizer.Sanitize(html);

        Assert.Contains(ours, result);
        Assert.Contains(video, result);
        Assert.DoesNotContain("other-cloud", result);
    }
}
