namespace TechForum.Api.Models;

// A picture of the slider at the top of the home page. Administrators manage the banners.
public sealed class Banner
{
    public Guid Id { get; set; }

    // Short text. It is also the alternative text of the picture.
    public required string Title { get; set; }

    // Address of the uploaded picture, for example /media/banners/abc.png.
    public required string ImageUrl { get; set; }

    // Where a click on the banner goes: a page of the site ("/articles") or a full http(s) address.
    public string? LinkUrl { get; set; }

    // Smaller numbers come first.
    public int DisplayOrder { get; set; }

    public bool IsActive { get; set; } = true;

    // The banner is shown from this moment (empty means it is already shown).
    public DateTimeOffset? StartsAtUtc { get; set; }

    // The banner stops being shown at this moment (empty means it is shown without end).
    public DateTimeOffset? EndsAtUtc { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }
}
