using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace TechForum.Api.Models;

public sealed class ApplicationUser : IdentityUser
{
    public required string DisplayName { get; set; }

    public string? Bio { get; set; }

    public string? AvatarUrl { get; set; }

    [MaxLength(1000)]
    public string? LockReason { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }
}
