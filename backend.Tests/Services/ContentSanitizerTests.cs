using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class ContentSanitizerTests
{
    private readonly ContentSanitizer sanitizer = new();

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
    public void Sanitize_PreservesTextAndCodeButRemovesMediaUntilUploadIsAvailable()
    {
        const string html = """
            <h2>Tiêu đề</h2>
            <pre><code class="language-csharp">var answer = 42;</code></pre>
            <img src="https://localhost/uploads/image.png" alt="Mô tả">
            <video controls src="https://localhost/uploads/video.mp4"></video>
            """;

        var result = sanitizer.Sanitize(html);

        Assert.Contains("<h2>Tiêu đề</h2>", result);
        Assert.Contains("<code class=\"language-csharp\">", result);
        Assert.DoesNotContain("<img", result, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("<video", result, StringComparison.OrdinalIgnoreCase);
    }
}
