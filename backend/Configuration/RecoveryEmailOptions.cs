namespace TechForum.Api.Configuration;

public sealed class RecoveryEmailOptions
{
    public const string SectionName = "RecoveryEmail";
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UseTls { get; set; } = true;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
    public string FrontendUrl { get; set; } = string.Empty;
}
