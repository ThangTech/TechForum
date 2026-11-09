namespace TechForum.Api.Services;

public enum MediaDeleteResult
{
    Deleted,
    NotFound,
    Attached,
    // The record is kept because the file could not be deleted from Cloudinary now.
    Unavailable
}
