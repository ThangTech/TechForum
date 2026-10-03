namespace TechForum.Api.Enums;

public enum AuthFailureKind
{
    None,
    Validation,
    DuplicateEmail,
    InvalidCredentials,
    LockedOut
}
