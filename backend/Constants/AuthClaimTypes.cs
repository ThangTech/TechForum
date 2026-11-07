namespace TechForum.Api.Constants;

public static class AuthClaimTypes
{
    // Copy of the account security stamp. It changes when the password changes,
    // so access tokens issued before that moment stop working.
    public const string SecurityStamp = "stamp";
}
