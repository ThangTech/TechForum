using Microsoft.AspNetCore.Identity;

namespace TechForum.Api.Models;

public sealed class ApplicationUser : IdentityUser
{
    public required string DisplayName { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }
}
