namespace TechForum.Api.Services;

public interface IContentSanitizer
{
    string Sanitize(string html);
}
