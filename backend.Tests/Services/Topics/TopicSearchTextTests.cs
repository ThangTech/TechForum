using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class TopicSearchTextTests
{
    [Theory]
    [InlineData("Lập trình", "lap trinh")]
    [InlineData("Đường dẫn ĐỘNG", "duong dan dong")]
    [InlineData("  Kiểu   dữ\nliệu ", "kieu du lieu")]
    [InlineData("ASP.NET Core", "asp.net core")]
    public void Normalize_DropsVietnameseMarksAndCase(string input, string expected)
    {
        Assert.Equal(expected, TopicSearchText.Normalize(input));
    }

    [Fact]
    public void Build_KeepsTheTextOfTheBodyWithoutTags()
    {
        var text = TopicSearchText.Build("Tiêu đề", "Tóm tắt", "<p>Dùng <strong>useState</strong> &amp; hook</p>");

        Assert.Equal("tieu de tom tat dung usestate & hook", text);
    }

    [Fact]
    public void Words_SplitsTheKeywordAndIgnoresRepeats()
    {
        Assert.Equal(["kieu", "du", "lieu"], TopicSearchText.Words("Kiểu dữ  liệu kiểu"));
        Assert.Empty(TopicSearchText.Words("   "));
    }
}
