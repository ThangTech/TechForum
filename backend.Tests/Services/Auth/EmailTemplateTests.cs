using Microsoft.Extensions.Options;
using MimeKit;
using TechForum.Api.Configuration;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class EmailTemplateTests
{
    [Fact]
    public void Action_HasTheButtonTheBackupLinkAndEscapesText()
    {
        var html = EmailTemplate.Action("An <Admin>", "Giới thiệu", "Xác minh email",
            "https://forum.example/verify#a=1&b=2", "Ghi chú", "contact@forum.example");

        Assert.Contains("Chào An &lt;Admin&gt;,", html);
        Assert.Contains(">Xác minh email</a>", html);
        Assert.Contains("href=\"https://forum.example/verify#a=1&amp;b=2\"", html);
        Assert.Contains("mailto:contact@forum.example", html);
    }

    [Fact]
    public void CreateMessage_WithHtml_SendsTextAndHtmlTogether()
    {
        var sender = new EmailSender(Options.Create(new RecoveryEmailOptions { FromAddress = "no-reply@forum.example" }));

        var message = sender.CreateMessage("member@example.com", "Tiêu đề", "Bản chữ", "<p>Bản HTML</p>");

        var alternative = Assert.IsType<MultipartAlternative>(message.Body);
        Assert.Equal("Bản chữ", alternative.TextBody.Trim());
        Assert.Contains("Bản HTML", alternative.HtmlBody);
    }
}
